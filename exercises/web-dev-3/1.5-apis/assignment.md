# Otherworldly Artifacts Gallery

## Overview

In this project, you will build an interactive web application that allows users to browse a gallery of mysterious and otherworldly artifacts. Your application will load data from a remote API, display a list of artifacts, show images, and present detailed information when a user selects an item.

This assignment focuses on practicing:

- DOM operations  
- Event listeners  
- Functions and objects  
- Fetch requests  
- JSON data handling  

You may use the example UI provided in your course materials for inspiration, but the interface you build should be **your own unique design**.

---

## Requirements

### User Interface

Your application must include:

1. **A list of artifacts**  
   - Display several key attributes for each item.  
   - Include the artifact's image.  

2. **A modal dialog**  
   - Presented when a user selects an item.  
   - Shows **all attributes** and the image.  
   - Includes a **close button** to dismiss the modal.

3. **Readable, well‑labeled information**  
   - Use static labels and clear text formatting for each displayed data attribute.  

4. **Enhanced typography and icons**  
   - Use at least **one external typeface**.  
   - Use at least **one icon set**.

---

## Data & Fetch Requirements

- Load artifact data using a **Fetch request**.
- Data is provided as JSON from the following API endpoint:

```
https://artifacts-api.up.railway.app/artifacts
```

- Use a tool such as **Postman** to inspect the API response before implementation.
- Update `img` element `src` attributes using the `image_url` provided in each artifact object.

---

## Implementation Requirements

- Use **separate functions** to organize logic and UI behavior.
- Use DOM manipulation and event listeners for:
  - Rendering the gallery list
  - Updating UI elements
  - Opening and closing the modal dialog  

---

## Optional Challenges

If you'd like to push your design and functionality further, consider:

- Implementing a **two‑dimensional grid layout** for the gallery.
- Limiting the number of displayed items with **pagination**.

- Creating a **more visually polished** and custom interface.
