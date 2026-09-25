# Query Selector All

This lesson demonstrates how to **query mulitple HTML at once** with JavaScript and perform individual operations on each element. This will be used to create a game of Tic Tac Toe.

---

## Getting Multiple Inputs from the HTML

In the previous lesson, we used **querySelector** to grab an element from the DOM. We then performed actions on that element that were reflected on the front end. If multiple elements have the same class, however, we can actually grab all of those elements at once! This will put all those elements into an array and we can do some pretty cool stuff with it. 

For this lesson, you will be creating a game that requires many tiles that when clicked, will become either an X or an O, depending on who's turn it is. We can grab all these tiles at once using querySelectorAll(). This returns a Nodelist of all elements that match the selector

```html
<div class="tile">X</div>
<div class="tile">X</div>
<div class="tile">X</div>
```

```javascript
let tilesList = document.querySelectorAll(".tile");
```

---

## Looping through each element

Every new element can be looped through and adjusted. The coolest part of all is that you can actually assign an **Event Listener** to each element in the loop it will function simultaneously with all others!  

```javascript
for (let tile of tilesList) {
    tile.addEventListener("click", function () {
        tile.textContent = "O";
    })
}
```

This code makes it so whenever you click **any** of the tiles, the text of that tile with turn from an X to and O.
You can also use the `forEach()` method.

```javascript
tiles.forEach((tile) => {
  tile.addEventListener("click", () => {
    tile.textContent = "O";
  });
});
```

---

## Key Takeaways

- `document.querySelectorAll()` selects all matching elements and returns a NodeList.
- Iterate a NodeList with either `for...of` or .`forEach()`.
- Attach a listener to each element with `element.addEventListener("event", handler)`.