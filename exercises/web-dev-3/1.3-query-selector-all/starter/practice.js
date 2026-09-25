// Practice getting an array of elements and using them
// Check README.md for instructions

let tilesList = document.querySelectorAll(".tile");

for (let tile of tilesList) {
    tile.addEventListener("click", function () {
        tile.textContent = "O";
    })
}