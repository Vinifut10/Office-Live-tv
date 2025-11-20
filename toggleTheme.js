const btn = document.getElementById("toggleTheme");

// Se tiver tema salvo no localStorage, aplica
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    // Salva preferência
    if (document.body.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
});