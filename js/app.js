document.addEventListener('DOMContentLoaded', iniciarApp);

function iniciarApp(){

	//Variables
	const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
	const contenedorCate = document.querySelector('#categorias');
	const resultado = document.querySelector('#resultado');
	const modal = new bootstrap.Modal('#modal', {});

	// Selector de favoritos
	const favoritosDiv = document.querySelector('.favoritos');

	// para que se ejecute unicamente en index
	if(contenedorCate){
		contenedorCate.addEventListener('change', seleccionarCategoria);
		obtenerCategorias();
	}

	// Para que se ejecute unicamente en favoritos
	if(favoritosDiv){
		obtenerFavoritos();
	}

	// Funciones
	function obtenerFavoritos(){
		const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
		
		// Validar que hallan elementos en el localStorage
		if(favoritos.length){
			mostraRecetas(favoritos);
			return;
		}

		const noFavoritos = document.createElement('p');
		noFavoritos.textContent = 'No has añadido favoritos aún';
		noFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
		favoritosDiv.appendChild(noFavoritos);
	}


	function obtenerCategorias(){
		
		fetch(url)
			.then(respuesta => respuesta.json())
			.then(resultado => { 
				nuevaCategoria(resultado.categories)
			})
			.catch( error => {
				console.log(error)
			})
	}
	function nuevaCategoria (categorias = []){
		categorias.forEach( categoria => {
			const { strCategory } = categoria; // Aplica desestructuración
			// por cada iteración se realiza lo siguiente
			const itemCategoria = document.createElement('option');
			itemCategoria.value = strCategory;
			itemCategoria.textContent = strCategory;
			contenedorCate.appendChild(itemCategoria);
		});
	}
	function seleccionarCategoria(e){
		const categoria = e.target.value;
		const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

		fetch(url)
			.then(respuesta => respuesta.json())
			.then( resultado => { 
				mostraRecetas(resultado.meals)
			})
	}
	function mostraRecetas(recetas = []){
		limpiarHTML(resultado);

		const heading = document.createElement('h2');
		heading.classList.add('text-center', 'text-black', 'my-5');
		heading.textContent = recetas.length ? 'Resultados' : 'No hay resultados';

		resultado.appendChild(heading);

		recetas.forEach( receta => {
			// desestructurar el objeto
			const {idMeal, strMeal, strMealThumb} = receta;

			const recetaContenedor = document.createElement('div');
			recetaContenedor.classList.add('col-md-4');

			const recetaCard = document.createElement('div');
			recetaCard.classList.add('card', 'mb-4');

			const recetaImagen = document.createElement('img');
			recetaImagen.classList.add('card-img-top');
			recetaImagen.alt = `Imagen de la receta de ${strMeal ?? receta.tittle}`;
			recetaImagen.src = strMealThumb ?? receta.img;

			const recetaCardBody = document.createElement('div');
			recetaCardBody.classList.add('card-body');

			const recetaHeading = document.createElement('h3');
			recetaHeading.classList.add('card-title', 'mb-3');
			recetaHeading.textContent = strMeal ?? receta.tittle;

			const recetaButton = document.createElement('button');
			recetaButton.classList.add('btn', 'btn-danger', 'w-100');
			recetaButton.textContent = 'Ver receta';
			//* Acción de abrir ventana de modal
			// recetaButton.dataset.bsTarget = '#modal';
			// recetaButton.dataset.bsToggle = 'modal';
			//* Agregar el evento de click para ver detalles de 
			recetaButton.onclick = function(){ //! Esta estructura es de callback y espera hasta el evento
				seleccionarReceta(idMeal ?? receta.id); //! onclick para que se llame, es la mejor
			}

			// Inyectar en el HTML
			recetaCardBody.appendChild(recetaHeading);
			recetaCardBody.appendChild(recetaButton);

			recetaCard.appendChild(recetaImagen);
			recetaCard.appendChild(recetaCardBody);

			recetaContenedor.appendChild(recetaCard);

			resultado.appendChild(recetaContenedor);
		})
	}

	function limpiarHTML(contenedor){
		while(contenedor.firstChild){
			contenedor.removeChild(contenedor.firstChild);
		}
	}

	function seleccionarReceta(id){
		const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
		fetch(url)
			.then(respuesta => respuesta.json())
			.then(resultado => {
				// console.log(resultado.meals[0]); //? De esta forma de abre como un objeto
				mostrarRecetaModal(resultado.meals[0]);
			})
	}

	function mostrarRecetaModal(receta){
		const { idMeal, strMeal, strInstructions, strMealThumb } = receta;
		
		// Selectores del modal
		const modalTittle = document.querySelector('#staticBackdropLabel');
		const modalBody = document.querySelector('.modal .modal-body');
		
		// Añadir contenido al modal
		modalTittle.textContent = strMeal;
		//! solo si los datos vienen de una API, es seguro utilizar innerHTML, de lo contrario no se de usar
		modalBody.innerHTML = `
			<img class="img-fluid" src="${strMealThumb}" alt="Imagen de ${strMeal}">
			<h3 class="my-3">Instructions</h3>
			<p>${strInstructions}</p>
			<h3>Ingredientes y cantidades</h3>
		`;

		// Listado que contendrá cada elemento
		const listGroup = document.createElement('ol');
		listGroup.classList.add('list-group');

		// Mostrar cantidades e ingredientes
		for(let i = 1; i < 20; i++){
			if(receta[`strIngredient${i}`]){ //* valida si el campo contiene información 
				const ingrediente = receta[`strIngredient${i}`]; //* si la contiene accede el contenido
				const cantidad = receta[`strMeasure${i}`];
				
				// Estructura ingrediente con cantidad
				const ingredienteLi = document.createElement('li');
				ingredienteLi.classList.add('list-group-item');
				ingredienteLi.textContent = `${ingrediente} = ${cantidad}`; //? Todo estructurado en un Li

				// Agrega cada elemento a la lista
				listGroup.appendChild(ingredienteLi);
			}
		}

		// Ubica la lista dentro del modal
		modalBody.appendChild(listGroup)

		// Botones de cerrar y favorito
		const btnFavorito = document.createElement('button');
		btnFavorito.classList.add('btn', 'btn-danger', 'col');
		btnFavorito.textContent = validarExistenciaStorage(idMeal) ? 'Eliminar favorito' : 'Guardar favorito';

		const btnCerrarModal = document.createElement('button');
		btnCerrarModal.classList.add('btn', 'btn-secondary', 'col')
		btnCerrarModal.textContent = 'Cerrar';
		//! Aquí se utiliza la instancia de modal
		btnCerrarModal.onclick = function(){
			modal.hide(); // Esto ocultará el modal
		}
		// Almacenar en el LocalStorage
		//* Para almacenar en localStorage se necesita una información
		btnFavorito.onclick = function(){
			if(validarExistenciaStorage(idMeal)){
				eliminarFavorito(idMeal);
				btnFavorito.textContent = 'Guardar favorito';
				mostrarToast('Eliminado correctamente')
				return;
			}

			agregarfavorito({ //* se le pasa un objeto, con toda la información del elemento 
				id: idMeal, //* que mando a llamar esta función
				tittle: strMeal,
				img: strMealThumb
			});

			btnFavorito.textContent = 'Eliminar favorito';
			mostrarToast('Agregado a favoritos');
		}

		// Agregar botones
		const modalFooter = document.querySelector('.modal-content .modal-footer');
		limpiarHTML(modalFooter);
		modalFooter.appendChild(btnFavorito);
		modalFooter.appendChild(btnCerrarModal);
		
		// Muestra el modal
		modal.show();
	}

	function agregarfavorito(receta){
		//! Cuando no exista el getItem de favoritos, se requiere el operador de coalescencia nula
		//! A demás se deja como un arreglo vació 
		const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
		// Se agrega el nuevo elemento al localStorage
		localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));
	}

	function validarExistenciaStorage(id){
		const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
		return favoritos.some(favorito => favorito.id === id);
	}

	function eliminarFavorito(id){
		const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
		const nuevosFavoritos = favoritos.filter( favorito => {
			return favorito.id !== id;
		});
		localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
	}

	function mostrarToast(mensaje){
		const toastDiv = document.querySelector('#toast');
		const toastBody = document.querySelector('.toast-body');
		const toast = new bootstrap.Toast(toastDiv);

		toastBody.textContent = mensaje;
		toast.show();

	}
}