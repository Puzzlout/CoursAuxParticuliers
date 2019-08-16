var name = document.getElementById('name');
var email = document.getElementById('email');
var message = document.getElementById('message');
var form = document.getElementById('contact-me');
var validation = document.createElement('div');
validation.id = 'notify';
validation.style.display = 'none';

form.appendChild(validation);

name.addEventListener('invalid', function(event) {
    event.preventDefault();
    if (!event.target.validity.valid) {
        name.className = 'invalid animated shake';
        validation.textContent = 'Merci de saisir au minimum votre nom et prénom (min: 1 ; max: 60)';
        validation.className = 'error';
        validation.style.display = 'block';
    }
});

name.addEventListener('input', function(event) {
    if ('block' === elem.style.display) {
        input.className = '';
        elem.style.display = 'none';
    }
});