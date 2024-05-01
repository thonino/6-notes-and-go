// Toggle InputEmail
var showInputEmail = document.getElementById("showInputEmail");
var inputEmail = document.getElementById("inputEmail");
showInputEmail.addEventListener("click", function () {
  if (inputEmail.classList.contains("d-none")) {
    inputEmail.classList.remove("d-none");
    inputEmail.classList.add("d-flex");
  } else {
    inputEmail.classList.remove("d-flex");
    inputEmail.classList.add("d-none");
  }
});
// Toggle InputPassword
var showInputPassword = document.getElementById("showInputPassword");
var inputPassword = document.getElementById("inputPassword");
showInputPassword.addEventListener("click", function () {
  if (inputPassword.classList.contains("d-none")) {
    inputPassword.classList.remove("d-none");
    inputPassword.classList.add("d-flex");
  } else {
    inputPassword.classList.remove("d-flex");
    inputPassword.classList.add("d-none");
  }
});
// DELETE CONFIRMATION
function confirmDelete() {
  if (confirm("Are you sure you want delete your account ?")) {
    document.getElementById("deleteForm").submit();
  }
}

// MODAL 
document.addEventListener("DOMContentLoaded", function () {
  var myModal = new bootstrap.Modal(
    document.getElementById("exampleModal")
  );
});
