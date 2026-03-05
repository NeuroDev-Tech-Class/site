// Apply theme immediately (before page paint) to prevent flash and ensure consistency
(function () {
  const theme = localStorage.getItem('theme') || 'dark-mode';
  if (theme === 'dark-mode') document.body.classList.add('dark-mode');
})();

document.head.innerHTML += `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="index, follow" />
  <meta
    name="description"
    content="Explore NeuroDev Tech Class courses including Python, web development, game design, and tech skills in St. George. Our curriculum focuses on practical, hands-on learning for neurodivergent students."
  />
  <meta
    name="keywords"
    content="NeuroDev Tech Class, vocational tech school St. George, tech curricula NeuroDev, Python courses, web development courses, game development courses, St. George UT, neurodivergent tech education, neurodevelopmental mentoring, NDM"
  />
  <meta name="author" content="NeuroDev Mentoring" />
  <title>NeuroDev Tech Class</title>
  <link rel="stylesheet" href="assets/css/styles.css" />
  <link rel="stylesheet" href="assets/css/auth.css" />
  <link
    rel="icon"
    type="image/png"
    sizes="32x32"
    href="assets/images/NeuroDev-favicon-32x32.png"
  />
`;
