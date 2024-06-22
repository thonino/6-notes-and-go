// Toggle InputEmail
document.addEventListener("DOMContentLoaded", function () {
  var showInputEmail = document.getElementById("showInputEmail");
  var inputEmail = document.getElementById("inputEmail");
  if (showInputEmail) {
    showInputEmail.addEventListener("click", function () {
      inputEmail.classList.toggle("d-none");
      inputEmail.classList.toggle("d-flex");
    });
  }
});

// Toggle InputPassword
document.addEventListener("DOMContentLoaded", function () {
  var showInputPassword = document.getElementById("showInputPassword");
  var inputPassword = document.getElementById("inputPassword");
  if (showInputPassword) {
    showInputPassword.addEventListener("click", function () {
      inputPassword.classList.toggle("d-none");
      inputPassword.classList.toggle("d-flex");
    });
  }
});

// Toggle InputDelete
document.addEventListener("DOMContentLoaded", function () {
  var showInputDelete = document.getElementById("showInputDelete");
  var inputDelete = document.getElementById("inputDelete");
  if (showInputDelete) {
    showInputDelete.addEventListener("click", function () {
      inputDelete.classList.toggle("d-none");
      inputDelete.classList.toggle("d-flex");
    });
  }
});

// DELETE CONFIRMATION
function confirmDeleteUser() {
  if (confirm("Are you sure you want delete your account ?")) {
    document.getElementById("inputDelete").submit();
  }
}
function confirmDeleteNote(noteId) {
  if (confirm("Are you sure you want to delete this Note?")) {
    document.getElementById(`deleteNote${noteId}`).submit();
  }
}
function confirmDeleteLesson() {
  if (confirm("Are you sure you want to delete this Lesson ?")) {
    document.getElementById(`deleteLesson`).submit();
  }
}

// HIDE CREATE CATEGORY
function hideContainer(selected) {
  var categoryContainer = document.getElementById("categoryContainer");
  if (selected.value === "newCat") {
    categoryContainer.style.display = "block";
  } else {
    categoryContainer.style.display = "none";
  }
}


// HIDE CREATE categoryContainer
function hideContainer2(selected) {
  var categoryContainer = document.getElementById("categoryContainer2");
  if (selected.value === "newCat") {
    categoryContainer.style.display = "block";
  } else {
    categoryContainer.style.display = "none";
  }
}

// SUBMIT lessonSelect
const lessonSelect = document.getElementById('lessonSelect');
  if (lessonSelect) {
    lessonSelect.addEventListener('change', function () {
      document.getElementById('lessonForm').submit();
    });
  }
  
// SUBMIT categoryFilter
const categoryFilter = document.getElementById('categoryFilter');
if (categoryFilter) {
  categoryFilter.addEventListener('change', function () {
    document.getElementById('categoryFilterForm').submit();
  });
}

// Initialiser ScrollReveal Right
ScrollReveal().reveal('.showright2k', { 
  distance: '250px',
  duration: 2000,
  origin: 'right',
  easing: 'ease-in-out',
});

// Initialiser ScrollRevealleft
ScrollReveal().reveal('.showleft3k', { 
  distance: '500px',
  duration: 1000,
  origin: 'left',
  easing: 'ease-in-out',
});

// Initialiser ScrollRevealleft
ScrollReveal().reveal('.showleftspeed', { 
  distance: '100px',
  duration: 500,
  origin: 'left',
});

// Initialiser ScrollRevealleft
ScrollReveal().reveal('.showrightspeed', { 
  distance: '100px',
  duration: 500,
  origin: 'right',
});

// Initialiser ScrollReveal Right 2
ScrollReveal().reveal('.showright2', { 
  distance: '50px',
  duration: 1200,
  origin: 'right',
  easing: 'ease-in-out',
});

// Initialiser ScrollReveal Right 2
ScrollReveal().reveal('.show2', { 
  duration: 1500,
  easing: 'ease-in-out',
});

// Initialiser ScrollRevealleft 2
ScrollReveal().reveal('.showleft2', { 
  distance: '50px',
  duration: 1200,
  origin: 'left',
  easing: 'ease-in-out',
});

// Initialiser ScrollReveal top
ScrollReveal().reveal('.showtop2', { 
  distance: '50px',
  duration: 1500,
  origin: 'top',
  easing: 'ease-in-out',
});

// Initialiser ScrollReveal Right
ScrollReveal().reveal('.showright', { 
  distance: '100px',
  duration: 500,
  origin: 'right',
  easing: 'ease-in-out',

});

// Initialiser ScrollRevealleft
ScrollReveal().reveal('.showleft', { 
  distance: '100px',
  duration: 1000,
  origin: 'left',
  easing: 'ease-in-out',

});

// Initialiser ScrollReveal bottom
ScrollReveal().reveal('.showbottom', { 
  distance: '100px',
  duration: 1000,
  origin: 'bottom',
  easing: 'ease-in-out',
});

// Initialiser ScrollReveal top
ScrollReveal().reveal('.showtop', { 
  distance: '100px',
  duration: 1000,
  origin: 'top',
  easing: 'ease-in-out',
});