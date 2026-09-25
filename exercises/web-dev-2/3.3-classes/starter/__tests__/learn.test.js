const classesPractice = require('../practice');

// 1. Car Class
test('Car getDescription should return "Toyota Camry (2020)" when given ("Toyota","Camry",2020)', () => {
  let car = new classesPractice.Car("Toyota","Camry",2020);
  expect(car.getDescription()).toEqual("Toyota Camry (2020)");
});
test('Car getDescription should return "Honda Civic (2018)" when given ("Honda","Civic",2018)', () => {
  let car = new classesPractice.Car("Honda","Civic",2018);
  expect(car.getDescription()).toEqual("Honda Civic (2018)");
});
test('Car getDescription should return "Ford F-150 (2023)" when given ("Ford","F-150",2023)', () => {
  let car = new classesPractice.Car("Ford","F-150",2023);
  expect(car.getDescription()).toEqual("Ford F-150 (2023)");
});
test('Car getDescription should return "Tesla Model 3 (2021)" when given ("Tesla","Model 3",2021)', () => {
  let car = new classesPractice.Car("Tesla","Model 3",2021);
  expect(car.getDescription()).toEqual("Tesla Model 3 (2021)");
});

// 2. Circle Class
test('Circle area should return approximately 78.54 when radius is 5', () => {
  let c = new classesPractice.Circle(5);
  expect(c.area).toBeCloseTo(78.54, 2);
});
test('Circle circumference should return approximately 31.42 when radius is 5', () => {
  let c = new classesPractice.Circle(5);
  expect(c.circumference).toBeCloseTo(31.42, 2);
});
test('Circle area should return approximately 12.57 when radius is 2', () => {
  let c = new classesPractice.Circle(2);
  expect(c.area).toBeCloseTo(12.57, 2);
});
test('Circle circumference should return approximately 12.57 when radius is 2', () => {
  let c = new classesPractice.Circle(2);
  expect(c.circumference).toBeCloseTo(12.57, 2);
});

// 3. Animal Inheritance
test('Animal speak should return "Generic makes a sound" when name is "Generic"', () => {
  let a = new classesPractice.Animal("Generic");
  expect(a.speak()).toEqual("Generic makes a sound");
});
test('Dog speak should return "Rex barks!" when name is "Rex"', () => {
  let d = new classesPractice.Dog("Rex");
  expect(d.speak()).toEqual("Rex barks!");
});
test('Animal speak should return "Buddy makes a sound" when name is "Buddy"', () => {
  let a = new classesPractice.Animal("Buddy");
  expect(a.speak()).toEqual("Buddy makes a sound");
});
test('Dog speak should return "Max barks!" when name is "Max"', () => {
  let d = new classesPractice.Dog("Max");
  expect(d.speak()).toEqual("Max barks!");
});

// 4. Book Class
test('Book getSummary should return "1984 by George Orwell, 328 pages" when given ("1984","George Orwell",328)', () => {
  let b = new classesPractice.Book("1984","George Orwell",328);
  expect(b.getSummary()).toEqual("1984 by George Orwell, 328 pages");
});
test('Book getSummary should return "Dune by Frank Herbert, 412 pages" when given ("Dune","Frank Herbert",412)', () => {
  let b = new classesPractice.Book("Dune","Frank Herbert",412);
  expect(b.getSummary()).toEqual("Dune by Frank Herbert, 412 pages");
});
test('Book getSummary should return "It by Stephen King, 1138 pages" when given ("It","Stephen King",1138)', () => {
  let b = new classesPractice.Book("It","Stephen King",1138);
  expect(b.getSummary()).toEqual("It by Stephen King, 1138 pages");
});
test('Book getSummary should return "Hamlet by William Shakespeare, 160 pages" when given ("Hamlet","William Shakespeare",160)', () => {
  let b = new classesPractice.Book("Hamlet","William Shakespeare",160);
  expect(b.getSummary()).toEqual("Hamlet by William Shakespeare, 160 pages");
});

// 5. BankAccount Class
test('BankAccount getBalance should return 120 after depositing 50 and withdrawing 30 from 100', () => {
  let acct = new classesPractice.BankAccount("Alice",100);
  acct.deposit(50);
  acct.withdraw(30);
  expect(acct.getBalance()).toEqual(120);
});
test('BankAccount getBalance should return 70 after depositing 20 and withdrawing 50 from 100', () => {
  let acct = new classesPractice.BankAccount("Bob",100);
  acct.deposit(20);
  acct.withdraw(50);
  expect(acct.getBalance()).toEqual(70);
});
test('BankAccount getBalance should return 200 after depositing 100 and withdrawing 0 from 100', () => {
  let acct = new classesPractice.BankAccount("Charlie",100);
  acct.deposit(100);
  acct.withdraw(0);
  expect(acct.getBalance()).toEqual(200);
});
test('BankAccount getBalance should return 0 after depositing 0 and withdrawing 0 from 0', () => {
  let acct = new classesPractice.BankAccount("Dana",0);
  acct.deposit(0);
  acct.withdraw(0);
  expect(acct.getBalance()).toEqual(0);
});
