// Inicializar Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://jwjcwhadttdhznvubmsq.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3amN3aGFkdHRkaHpudnVibXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4ODE5NzQsImV4cCI6MjAzODQ1Nzk3NH0.DL1jhacgdwN6oJChAeiOTa5to05haGeE0IHWiiqMiZ0"
const supabase = createClient(supabaseUrl, supabaseKey)

// Elementos del DOM
const bookForm = document.getElementById('book-form');
const booksList = document.getElementById('books-list');

// Evento para agregar un nuevo libro
bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const notes = document.getElementById('notes').value;
    const rating = document.getElementById('rating').value;
    const coverFile = document.getElementById('cover').files[0];

    let coverUrl = '';
    if (coverFile) {
        const reader = new FileReader();
        reader.readAsDataURL(coverFile);
        await new Promise(resolve => {
            reader.onload = () => {
                coverUrl = reader.result;
                resolve();
            };
        });
    }

    try {
        const { data, error } = await supabase
            .from('books')
            .insert([
                { title, author, notes, rating, cover_url: coverUrl }
            ]);

        if (error) throw error;

        console.log('Book added successfully', data);
        bookForm.reset();
        await loadBooks();
    } catch (error) {
        console.error('Error adding book:', error);
    }
});

// Función para cargar y mostrar los libros
async function loadBooks() {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayBooks(data);
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

// Función para mostrar los libros en la página
function displayBooks(books) {
    booksList.innerHTML = '<h2>Libros Leídos</h2>';
    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.classList.add('book-item');
        bookElement.innerHTML = `
            <h3>${book.title}</h3>
            <p>Autor: ${book.author}</p>
            <p>Puntuación: ${book.rating}/5</p>
            <p>Notas: ${book.notes}</p>
            ${book.cover_url ? `<img src="${book.cover_url}" alt="Portada de ${book.title}">` : ''}
            <button onclick="editBook(${book.id})">Editar</button>
            <button onclick="deleteBook(${book.id})">Eliminar</button>
        `;
        booksList.appendChild(bookElement);
    });
}

// Función para editar un libro
async function editBook(id) {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching book:', error);
        return;
    }

    // Rellenar el formulario con los datos del libro
    document.getElementById('title').value = data.title;
    document.getElementById('author').value = data.author;
    document.getElementById('notes').value = data.notes;
    document.getElementById('rating').value = data.rating;

    // Cambiar el botón de envío para actualizar en lugar de agregar
    const submitButton = bookForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Actualizar Libro';
    
    // Agregar un atributo data-id al formulario para identificar el libro que se está editando
    bookForm.setAttribute('data-id', id);

    // Modificar el evento de envío del formulario para manejar la actualización
    bookForm.onsubmit = async (e) => {
        e.preventDefault();

        const updatedBook = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            notes: document.getElementById('notes').value,
            rating: document.getElementById('rating').value,
        };

        const { error } = await supabase
            .from('books')
            .update(updatedBook)
            .eq('id', id);

        if (error) {
            console.error('Error updating book:', error);
        } else {
            console.log('Book updated successfully');
            bookForm.reset();
            submitButton.textContent = 'Agregar Libro';
            bookForm.removeAttribute('data-id');
            bookForm.onsubmit = null; // Eliminar este manejador de eventos personalizado
            loadBooks();
        }
    };
}

// Función para eliminar un libro
async function deleteBook(id) {
    const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting book:', error);
    } else {
        console.log('Book deleted successfully');
        loadBooks();
    }
}

// Cargar libros al iniciar la aplicación
loadBooks();

// Hacer las funciones editBook y deleteBook globales
window.editBook = editBook;
window.deleteBook = deleteBook;