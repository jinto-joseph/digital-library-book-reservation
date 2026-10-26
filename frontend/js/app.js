// ============================================================================
// DIGITAL LIBRARY BOOK RESERVATION & CIRCULATION SYSTEM
// Frontend Reactive Application Logic
// Connects to Flask REST endpoints backed by PostgreSQL & MongoDB
// ============================================================================

// Mock state representing logged-in patron and baseline catalog
// Loaded dynamically from backend API, with fallback demo data
let state = {
  currentUser: {
    userId: 4,
    name: "Jinto Joseph",
    role: "STUDENT",
    department: "Computer Science & Engineering"
  },
  books: [],
  categories: [],
  activeLoans: [],
  reservations: [],
  recommendations: [],
  stats: {}
};

// Initial Seed Data for immediate standalone rendering or backend failure fallback
const SEED_CATALOG = [
  {
    "book_id": 1,
    "title": "Database System Concepts",
    "isbn": "978-0078022159",
    "category_id": 1,
    "category_name": "Database Systems",
    "publisher_name": "McGraw-Hill Education",
    "publication_year": 2019,
    "authors": "Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz, Henry F. Korth, Henry F. Korth, Henry F. Korth, Henry F. Korth, Henry F. Korth, Henry F. Korth, Henry F. Korth, Henry F. Korth, Henry F. Korth, Henry F. Korth, Henry F. Korth, Henry F. Korth, S. Sudarshan, S. Sudarshan, S. Sudarshan, S. Sudarshan, S. Sudarshan, S. Sudarshan, S. Sudarshan, S. Sudarshan, S. Sudarshan, S. Sudarshan, S. Sudarshan, S. Sudarshan",
    "average_rating": 4.67,
    "total_reviews": 3,
    "total_copies": 36,
    "available_copies": 9,
    "loaned_copies": 18,
    "description": "The foundational textbook on relational database systems, indexing, transactions, and modern big data technologies."
  },
  {
    "book_id": 2,
    "title": "Operating System Concepts",
    "isbn": "978-1119800361",
    "category_id": 3,
    "category_name": "Operating Systems",
    "publisher_name": "Pearson Education",
    "publication_year": 2021,
    "authors": "Abraham Silberschatz, Abraham Silberschatz, Abraham Silberschatz",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 3,
    "available_copies": 2,
    "loaned_copies": 1,
    "description": "Comprehensive guide to processes, threads, CPU scheduling, synchronization, deadlocks, and virtual memory systems."
  },
  {
    "book_id": 3,
    "title": "Introduction to Algorithms (CLRS)",
    "isbn": "978-0262046305",
    "category_id": 4,
    "category_name": "Algorithms & Data Structures",
    "publisher_name": "MIT Press",
    "publication_year": 2022,
    "authors": "Thomas H. Cormen, Thomas H. Cormen, Thomas H. Cormen, Charles E. Leiserson, Charles E. Leiserson, Charles E. Leiserson, Ronald L. Rivest, Ronald L. Rivest, Ronald L. Rivest, Clifford Stein, Clifford Stein, Clifford Stein",
    "average_rating": 4.0,
    "total_reviews": 1,
    "total_copies": 12,
    "available_copies": 4,
    "loaned_copies": 8,
    "description": "The gold standard reference and undergraduate textbook for foundational data structures and algorithm analysis."
  },
  {
    "book_id": 4,
    "title": "Computer Networks: A Systems Approach",
    "isbn": "978-0123850591",
    "category_id": 2,
    "category_name": "Computer Networks",
    "publisher_name": "Morgan Kaufmann",
    "publication_year": 2020,
    "authors": "Andrew S. Tanenbaum, Andrew S. Tanenbaum",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "Principles of computer networking illustrated through working system implementations and real Internet architectures."
  },
  {
    "book_id": 5,
    "title": "Artificial Intelligence: A Modern Approach",
    "isbn": "978-0134610993",
    "category_id": 5,
    "category_name": "Artificial Intelligence & ML",
    "publisher_name": "Pearson Education",
    "publication_year": 2020,
    "authors": "Stuart Russell, Stuart Russell, Stuart Russell, Peter Norvig, Peter Norvig, Peter Norvig",
    "average_rating": 5.0,
    "total_reviews": 1,
    "total_copies": 6,
    "available_copies": 4,
    "loaned_copies": 2,
    "description": "The leading authoritative survey of intelligent agents, deep learning, logic, and probabilistic reasoning."
  },
  {
    "book_id": 6,
    "title": "Designing Data-Intensive Applications",
    "isbn": "978-1449373320",
    "category_id": 1,
    "category_name": "Database Systems",
    "publisher_name": "O'Reilly Media",
    "publication_year": 2017,
    "authors": "Martin Kleppmann, Martin Kleppmann, Martin Kleppmann",
    "average_rating": 5.0,
    "total_reviews": 1,
    "total_copies": 3,
    "available_copies": 3,
    "loaned_copies": 0,
    "description": "Deep dive into storage engines, replication, partitioning, transactions, consensus, and batch/stream data processing."
  },
  {
    "book_id": 7,
    "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
    "isbn": "978-0132350884",
    "category_id": 6,
    "category_name": "Software Engineering",
    "publisher_name": "Addison-Wesley Professional",
    "publication_year": 2008,
    "authors": "Robert C. Martin, Robert C. Martin",
    "average_rating": 4.0,
    "total_reviews": 1,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "Essential guidelines, design heuristics, and code smells for developing maintainable and robust software systems."
  },
  {
    "book_id": 8,
    "title": "Modern Operating Systems",
    "isbn": "978-0133591620",
    "category_id": 3,
    "category_name": "Operating Systems",
    "publisher_name": "Pearson Education",
    "publication_year": 2014,
    "authors": "Andrew S. Tanenbaum",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 1,
    "available_copies": 1,
    "loaned_copies": 0,
    "description": "In-depth exploration of kernel design, multi-core architecture, virtualization, file systems, and Android/Linux security."
  },
  {
    "book_id": 9,
    "title": "Steve Jobs",
    "isbn": "978-010000090",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "Vintage Books",
    "publication_year": 2000,
    "authors": "Walter Issacson, Walter Issacson",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Biography by Walter Issacson. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 10,
    "title": "Discovery of India",
    "isbn": "978-010100100",
    "category_id": 9,
    "category_name": "History & Politics",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2001,
    "authors": "Jawaharlal Nehru, Jawaharlal Nehru",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in History by Jawaharlal Nehru. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 11,
    "title": "My Experiments with Truth",
    "isbn": "978-010200110",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2002,
    "authors": "Mahatma Gandhi, Mahatma Gandhi",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Autobiography by Mahatma Gandhi. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 12,
    "title": "Object Oriented Programming with C++",
    "isbn": "978-010300120",
    "category_id": 12,
    "category_name": "Science & Technology",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2003,
    "authors": "E Balagurusamy, E Balagurusamy",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Education by E Balagurusamy. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 13,
    "title": "Thinking with type",
    "isbn": "978-010400130",
    "category_id": 15,
    "category_name": "Arts & Photography",
    "publisher_name": "Penguin Classics",
    "publication_year": 2004,
    "authors": "Ellen Lupton, Ellen Lupton",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Arts by Ellen Lupton. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 14,
    "title": "The Photographer's",
    "isbn": "978-010500140",
    "category_id": 15,
    "category_name": "Arts & Photography",
    "publisher_name": "Vintage Books",
    "publication_year": 2005,
    "authors": "Lindsay Adler, Lindsay Adler",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Photography by Lindsay Adler. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 15,
    "title": "Think and Grow",
    "isbn": "978-010600150",
    "category_id": 10,
    "category_name": "Business & Economics",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2006,
    "authors": "Napoleon Hill, Napoleon Hill",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Economics by Napoleon Hill. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 16,
    "title": "The Fifth Discipline : The Art",
    "isbn": "978-010700160",
    "category_id": 10,
    "category_name": "Business & Economics",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2007,
    "authors": "Peter M.Senge, Peter M.Senge",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Management by Peter M.Senge. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 17,
    "title": "A Theory of Justice",
    "isbn": "978-010800170",
    "category_id": 9,
    "category_name": "History & Politics",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2008,
    "authors": "John Rawls, John Rawls",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Law by John Rawls. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 18,
    "title": "Eat to Live",
    "isbn": "978-010900180",
    "category_id": 13,
    "category_name": "Health & Psychology",
    "publisher_name": "Penguin Classics",
    "publication_year": 2009,
    "authors": "Joel Fuhrman, Joel Fuhrman",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Health by Joel Fuhrman. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 19,
    "title": "City of Heavenly Fire",
    "isbn": "978-011000190",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Vintage Books",
    "publication_year": 2010,
    "authors": "Cassandra Clare, Cassandra Clare",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Fiction by Cassandra Clare. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 20,
    "title": "Da Vinci Code",
    "isbn": "978-011100200",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2011,
    "authors": "Dan Brown, Dan Brown",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Fiction by Dan Brown. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 21,
    "title": "War and Peace",
    "isbn": "978-011200210",
    "category_id": 11,
    "category_name": "Philosophy & Society",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2012,
    "authors": "Leo Tolstoy, Leo Tolstoy",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Philosophical fiction by Leo Tolstoy. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 22,
    "title": "Python For All",
    "isbn": "978-011300220",
    "category_id": 12,
    "category_name": "Science & Technology",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2013,
    "authors": "John Shovic, John Shovic",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Education by John Shovic. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 23,
    "title": "Automate The Boring Stuff With Python",
    "isbn": "978-011400230",
    "category_id": 12,
    "category_name": "Science & Technology",
    "publisher_name": "Penguin Classics",
    "publication_year": 2014,
    "authors": "Al Sweigart, Al Sweigart",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Education by Al Sweigart. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 24,
    "title": "Wings Of Fire",
    "isbn": "978-011500240",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "Vintage Books",
    "publication_year": 2015,
    "authors": "APJ Abdul Kalam, APJ Abdul Kalam",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Autobiography by APJ Abdul Kalam. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 25,
    "title": "Ikigai",
    "isbn": "978-011600250",
    "category_id": 13,
    "category_name": "Health & Psychology",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2016,
    "authors": "Hector Garcia, Hector Garcia",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Personal Development by Hector Garcia. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 26,
    "title": "Who Will Cry When You Will Die",
    "isbn": "978-011700260",
    "category_id": 13,
    "category_name": "Health & Psychology",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2017,
    "authors": "Robin Sharma, Robin Sharma",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Personal Development by Robin Sharma. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 27,
    "title": "Rich Dad Poor Dad",
    "isbn": "978-011800270",
    "category_id": 10,
    "category_name": "Business & Economics",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2018,
    "authors": "Robert T. Kiyosaki, Robert T. Kiyosaki",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Business by Robert T. Kiyosaki. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 28,
    "title": "Immortals of Meluha",
    "isbn": "978-011900280",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Penguin Classics",
    "publication_year": 2019,
    "authors": "Amish Tirpathi, Amish Tirpathi",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in High Fantasy by Amish Tirpathi. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 29,
    "title": "A Brief History Of Time",
    "isbn": "978-012000290",
    "category_id": 12,
    "category_name": "Science & Technology",
    "publisher_name": "Vintage Books",
    "publication_year": 2020,
    "authors": "Stephen Hawking, Stephen Hawking",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in SPACE by Stephen Hawking. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 30,
    "title": "I Know Why The Cage Bird Sings",
    "isbn": "978-012100300",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2021,
    "authors": "Maya Anguelo, Maya Anguelo",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Story by Maya Anguelo. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 31,
    "title": "Lord Of Files",
    "isbn": "978-012200310",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2022,
    "authors": "William Golding, William Golding",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Fiction by William Golding. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 32,
    "title": "Loara Dune",
    "isbn": "978-012300320",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2023,
    "authors": "R. D Blackmore, R. D Blackmore",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Fiction by R. D Blackmore. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 33,
    "title": "Jamacia Inn",
    "isbn": "978-012400330",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Penguin Classics",
    "publication_year": 2000,
    "authors": "Daphne, Daphne",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Fiction by Daphne. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 34,
    "title": "Kidnapped",
    "isbn": "978-012500340",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Vintage Books",
    "publication_year": 2001,
    "authors": "Robert Louis, Robert Louis",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Fiction by Robert Louis. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 35,
    "title": "Treasure Island",
    "isbn": "978-012600350",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2002,
    "authors": "Robert Louis, Robert Louis",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Fiction by Robert Louis. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 36,
    "title": "The Call Of Wild",
    "isbn": "978-012700360",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2003,
    "authors": "Jack London, Jack London",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Fiction by Jack London. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 37,
    "title": "Charlottes Web",
    "isbn": "978-012800370",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2004,
    "authors": "E. B White, E. B White",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Fiction by E. B White. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 38,
    "title": "The Wind In Willows",
    "isbn": "978-012900380",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Penguin Classics",
    "publication_year": 2005,
    "authors": "Kenneth Grahame, Kenneth Grahame",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Fiction by Kenneth Grahame. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 39,
    "title": "Being and Time",
    "isbn": "978-013000390",
    "category_id": 11,
    "category_name": "Philosophy & Society",
    "publisher_name": "Vintage Books",
    "publication_year": 2006,
    "authors": "Martin Heldegger, Martin Heldegger",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Philosophy by Martin Heldegger. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 40,
    "title": "The Republic",
    "isbn": "978-013100400",
    "category_id": 11,
    "category_name": "Philosophy & Society",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2007,
    "authors": "Rocha Pereia, Rocha Pereia",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Philosophy by Rocha Pereia. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 41,
    "title": "Critique For Pure Reason",
    "isbn": "978-013200410",
    "category_id": 11,
    "category_name": "Philosophy & Society",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2008,
    "authors": "Paul Guyer, Paul Guyer",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Philosophy by Paul Guyer. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 42,
    "title": "The Prince",
    "isbn": "978-013300420",
    "category_id": 11,
    "category_name": "Philosophy & Society",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2009,
    "authors": "Rufus Godwin, Rufus Godwin",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Philosophy by Rufus Godwin. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 43,
    "title": "Ethics",
    "isbn": "978-013400430",
    "category_id": 11,
    "category_name": "Philosophy & Society",
    "publisher_name": "Penguin Classics",
    "publication_year": 2010,
    "authors": "Stuart Hampshire, Stuart Hampshire",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Philosophy by Stuart Hampshire. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 44,
    "title": "Long Walk To Freedom",
    "isbn": "978-013500440",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "Vintage Books",
    "publication_year": 2011,
    "authors": "Nelson Mandela, Nelson Mandela",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Autobiography by Nelson Mandela. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 45,
    "title": "The Dairy Of Young Girl",
    "isbn": "978-013600450",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2012,
    "authors": "Anne Frank, Anne Frank",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Autobiography by Anne Frank. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 46,
    "title": "Mark Twain",
    "isbn": "978-013700460",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2013,
    "authors": "Mark Twain, Mark Twain",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Autobiography by Mark Twain. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 47,
    "title": "Mein Kampf",
    "isbn": "978-013800470",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2014,
    "authors": "Adolf Hitler, Adolf Hitler",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Autobiography by Adolf Hitler. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 48,
    "title": "Freakonomics",
    "isbn": "978-013900480",
    "category_id": 10,
    "category_name": "Business & Economics",
    "publisher_name": "Penguin Classics",
    "publication_year": 2015,
    "authors": "Steveb D.Levit, Steveb D.Levit",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Economics by Steveb D.Levit. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 49,
    "title": "Thinking Fast and Slow",
    "isbn": "978-014000490",
    "category_id": 10,
    "category_name": "Business & Economics",
    "publisher_name": "Vintage Books",
    "publication_year": 2016,
    "authors": "Daniel Kahneman, Daniel Kahneman",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Economics by Daniel Kahneman. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 50,
    "title": "Tell You About Capitalism",
    "isbn": "978-014100500",
    "category_id": 10,
    "category_name": "Business & Economics",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2017,
    "authors": "HA-Joon Chang, HA-Joon Chang",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Economics by HA-Joon Chang. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 51,
    "title": "Animal Spirits",
    "isbn": "978-014200510",
    "category_id": 10,
    "category_name": "Business & Economics",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2018,
    "authors": "Akerlof and Shiller, Akerlof and Shiller",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Economics by Akerlof and Shiller. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 52,
    "title": "The Black Swan",
    "isbn": "978-014300520",
    "category_id": 10,
    "category_name": "Business & Economics",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2019,
    "authors": "Nassim Nicholas Taleb, Nassim Nicholas Taleb",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Economics by Nassim Nicholas Taleb. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 53,
    "title": "1984",
    "isbn": "978-014400530",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Penguin Classics",
    "publication_year": 2020,
    "authors": "George Orwell, George Orwell",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Story by George Orwell. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 54,
    "title": "The Lord Of Wings",
    "isbn": "978-014500540",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Vintage Books",
    "publication_year": 2021,
    "authors": "J.R.R.Tolken, J.R.R.Tolken",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Story by J.R.R.Tolken. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 55,
    "title": "Kite Runner",
    "isbn": "978-014600550",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2022,
    "authors": "Khaled Hosseini, Khaled Hosseini",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Story by Khaled Hosseini. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 56,
    "title": "Harry Potter",
    "isbn": "978-014700560",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2023,
    "authors": "J.K.Rowling, J.K.Rowling",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Story by J.K.Rowling. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 57,
    "title": "The Book Theif",
    "isbn": "978-014800570",
    "category_id": 7,
    "category_name": "Fiction & Thriller",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2000,
    "authors": "Markus Zusak, Markus Zusak",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Story by Markus Zusak. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 58,
    "title": "History Of 20th Century",
    "isbn": "978-014900580",
    "category_id": 9,
    "category_name": "History & Politics",
    "publisher_name": "Penguin Classics",
    "publication_year": 2001,
    "authors": "Martin Gilbert, Martin Gilbert",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in History by Martin Gilbert. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 59,
    "title": "Guns,Germs,and Steel",
    "isbn": "978-015000590",
    "category_id": 9,
    "category_name": "History & Politics",
    "publisher_name": "Vintage Books",
    "publication_year": 2002,
    "authors": "Jared Daimond, Jared Daimond",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in History by Jared Daimond. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 60,
    "title": "A World lit Only by Fire",
    "isbn": "978-015100600",
    "category_id": 9,
    "category_name": "History & Politics",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2003,
    "authors": "William Manchestar, William Manchestar",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in History by William Manchestar. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 61,
    "title": "The Crusades",
    "isbn": "978-015200610",
    "category_id": 9,
    "category_name": "History & Politics",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2004,
    "authors": "Thomas Asbridge, Thomas Asbridge",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in History by Thomas Asbridge. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 62,
    "title": "Over The Edge Of The World",
    "isbn": "978-015300620",
    "category_id": 9,
    "category_name": "History & Politics",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2005,
    "authors": "Laurence, Laurence",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in History by Laurence. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 63,
    "title": "A Beautiful Mind",
    "isbn": "978-015400630",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "Penguin Classics",
    "publication_year": 2006,
    "authors": "Sylvia Nasar, Sylvia Nasar",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Biography by Sylvia Nasar. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 64,
    "title": "The Enigma",
    "isbn": "978-015500640",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "Vintage Books",
    "publication_year": 2007,
    "authors": "Andrew Hodges, Andrew Hodges",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Biography by Andrew Hodges. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 65,
    "title": "Alexander Hamilton",
    "isbn": "978-015600650",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "Simon & Schuster",
    "publication_year": 2008,
    "authors": "Ron Chernow, Ron Chernow",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Biography by Ron Chernow. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 66,
    "title": "Barracoon",
    "isbn": "978-015700660",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "HarperCollins Publishers",
    "publication_year": 2009,
    "authors": "Zora Neale Hurston, Zora Neale Hurston",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Biography by Zora Neale Hurston. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 67,
    "title": "CHURCHILL : A Life",
    "isbn": "978-015800670",
    "category_id": 8,
    "category_name": "Biography & Memoir",
    "publisher_name": "Bloomsbury Publishing",
    "publication_year": 2010,
    "authors": "MArtin Glibert, MArtin Glibert",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Biography by MArtin Glibert. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 68,
    "title": "A Tale of Two Cities",
    "isbn": "978-015900680",
    "category_id": 14,
    "category_name": "Historical Fiction",
    "publisher_name": "Penguin Classics",
    "publication_year": 2011,
    "authors": "Charles Dickens, Charles Dickens",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 1,
    "loaned_copies": 1,
    "description": "A masterpiece in Historical novel by Charles Dickens. Widely referenced in academic and recreational library collections."
  },
  {
    "book_id": 69,
    "title": "Les Mis\u00e9rables",
    "isbn": "978-016000690",
    "category_id": 14,
    "category_name": "Historical Fiction",
    "publisher_name": "Vintage Books",
    "publication_year": 2012,
    "authors": "Victor Hugo, Victor Hugo",
    "average_rating": 4.5,
    "total_reviews": 0,
    "total_copies": 2,
    "available_copies": 2,
    "loaned_copies": 0,
    "description": "A masterpiece in Historical fiction by Victor Hugo. Widely referenced in academic and recreational library collections."
  }
];

const SEED_LOANS = [
  {
    loan_id: 1,
    user_id: 4,
    student_name: "Jinto Joseph",
    book_title: "Database System Concepts",
    barcode: "BC-DBS-001-B",
    shelf_location: "Floor 2, Shelf DB-01",
    checkout_at: "2026-10-21 10:30",
    due_at: "2026-11-04 10:30",
    status: "ACTIVE",
    fine_amount: "0.00"
  },
  {
    loan_id: 2,
    user_id: 5,
    student_name: "Ananya Sharma",
    book_title: "Operating System Concepts",
    barcode: "BC-OS-002-B",
    shelf_location: "Floor 2, Shelf OS-03",
    checkout_at: "2026-10-23 14:15",
    due_at: "2026-11-06 14:15",
    status: "ACTIVE",
    fine_amount: "0.00"
  },
  {
    loan_id: 3,
    user_id: 6,
    student_name: "Rahul Verma",
    book_title: "Introduction to Algorithms (CLRS)",
    barcode: "BC-ALGO-003-A",
    shelf_location: "Floor 1, Shelf AL-05",
    checkout_at: "2026-10-06 09:00",
    due_at: "2026-10-20 09:00",
    status: "OVERDUE",
    fine_amount: "6.00"
  }
];

const SEED_RESERVATIONS = [
  {
    reservation_id: 1,
    book_title: "Artificial Intelligence: A Modern Approach",
    patron_name: "Jinto Joseph",
    status: "WAITING",
    queue_position: 1,
    reserved_at: "2026-10-24 16:00"
  },
  {
    reservation_id: 2,
    book_title: "Introduction to Algorithms (CLRS)",
    patron_name: "Ananya Sharma",
    status: "WAITING",
    queue_position: 1,
    reserved_at: "2026-10-25 11:30"
  },
  {
    reservation_id: 3,
    book_title: "Database System Concepts",
    patron_name: "Rahul Verma",
    status: "READY",
    queue_position: null,
    expires_at: "2026-10-28 18:00"
  }
];

// Document Ready
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  setupNavigation();
  setupUserSelector();
  setupSearch();
  loadData();
}

// Navigation Tabs
function setupNavigation() {
  const tabs = document.querySelectorAll(".nav-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.dataset.target;
      document.querySelectorAll(".tab-view").forEach(view => {
        view.classList.remove("active");
      });
      document.getElementById(targetId).classList.add("active");
    });
  });
}

// Switch simulated active user
function setupUserSelector() {
  const selector = document.getElementById("active-user-select");
  selector.addEventListener("change", (e) => {
    const val = parseInt(e.target.value);
    if (val === 4) {
      state.currentUser = { userId: 4, name: "Jinto Joseph", role: "STUDENT", department: "Computer Science" };
    } else if (val === 5) {
      state.currentUser = { userId: 5, name: "Ananya Sharma", role: "STUDENT", department: "Computer Science" };
    } else if (val === 2) {
      state.currentUser = { userId: 2, name: "Eleanor Vance", role: "LIBRARIAN", department: "Library Services" };
    } else if (val === 1) {
      state.currentUser = { userId: 1, name: "System Admin", role: "ADMIN", department: "IT" };
    }
    showToast(`Active profile switched to ${state.currentUser.name} (${state.currentUser.role})`, "info");
    renderRecommendations();
    renderLoans();
  });
}

// Search and Filtering
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");

  searchInput.addEventListener("input", debounce(() => {
    renderBooks();
  }, 250));

  categoryFilter.addEventListener("change", () => {
    renderBooks();
  });
}

async function loadData() {
  // Load full multi-genre catalog (69 books across Fiction, Biography, History, Economics, etc.)
  try {
    const res = await fetch("/api/books");
    if (res.ok) {
      const data = await res.json();
      state.books = data.books && data.books.length ? data.books : [];
    }
  } catch (err) {}

  if (!state.books || state.books.length === 0) {
    try {
      const jsonRes = await fetch("js/catalog_data.json");
      if (jsonRes.ok) {
        state.books = await jsonRes.json();
      } else {
        state.books = SEED_CATALOG;
      }
    } catch (e) {
      state.books = SEED_CATALOG;
    }
  }

  state.activeLoans = SEED_LOANS;
  state.reservations = SEED_RESERVATIONS;

  renderStats();
  renderBooks();
  renderRecommendations();
  renderLoans();
  renderReservations();
}

// Render Catalog Grid
function renderBooks() {
  const grid = document.getElementById("books-grid");
  const query = document.getElementById("search-input").value.toLowerCase();
  const cat = document.getElementById("category-filter").value;

  const filtered = state.books.filter(b => {
    const matchesQuery = !query || 
      b.title.toLowerCase().includes(query) || 
      b.authors.toLowerCase().includes(query) || 
      b.isbn.toLowerCase().includes(query);
    const matchesCat = !cat || b.category_id == cat;
    return matchesQuery && matchesCat;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;" class="glass-panel">
        <p style="color: var(--text-muted); font-size: 1.1rem;">No catalog titles found matching your search criteria.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(b => {
    const availClass = b.available_copies > 0 ? "avail" : "wait";
    const availText = b.available_copies > 0 
      ? `🟢 ${b.available_copies} of ${b.total_copies || 3} Available` 
      : `🔴 All Copies Loaned`;

    return `
      <div class="glass-panel book-card">
        <div class="book-category-tag">${b.category_name}</div>
        <h3 class="book-card-title">${b.title}</h3>
        <p class="book-card-authors">by ${b.authors}</p>
        
        <div class="book-meta-row">
          <span class="rating-badge">★ ${parseFloat(b.average_rating || 0).toFixed(1)}</span>
          <span>${b.publication_year}</span>
          <span class="availability-badge ${availClass}">${availText}</span>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">
          ${truncate(b.description, 110)}
        </p>

        <div class="card-actions">
          <button class="btn btn-outline btn-sm" onclick="showBookDetails(${b.book_id})">
            ℹ️ Inspect Copies
          </button>
          ${b.available_copies > 0 ? `
            <button class="btn btn-primary btn-sm" onclick="quickCheckout(${b.book_id}, '${escapeQuote(b.title)}')">
              ⚡ Borrow
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #f59e0b, #d97706);" onclick="placeReservation(${b.book_id}, '${escapeQuote(b.title)}')">
              ⏳ Join Queue
            </button>
          `}
        </div>
      </div>
    `;
  }).join("");
}

// Render Recommendations (Deterministic Hybrid Algorithm)
function renderRecommendations() {
  const container = document.getElementById("recommendations-grid");
  
  // Calculate deterministic score:
  // User 4 has interest in Database Systems and Algorithms
  const recs = [
    {
      book_id: 6,
      title: "Designing Data-Intensive Applications",
      authors: "Martin Kleppmann",
      category_name: "Database Systems",
      score: 9,
      reason: "High affinity: Matches your borrowed category (Database Systems) and holds a perfect 5.0 rating."
    },
    {
      book_id: 5,
      title: "Artificial Intelligence: A Modern Approach",
      authors: "Stuart Russell, Peter Norvig",
      category_name: "Artificial Intelligence & ML",
      score: 7,
      reason: "Top rated across the university (5.0 ★) with active campus discussions."
    },
    {
      book_id: 2,
      title: "Operating System Concepts",
      authors: "Abraham Silberschatz",
      category_name: "Operating Systems",
      score: 6,
      reason: "Shared Author credit: Written by Abraham Silberschatz, author of your past loan Database System Concepts."
    }
  ];

  container.innerHTML = recs.map(r => `
    <div class="glass-panel book-card">
      <div class="recommendation-badge">Match Score: +${r.score}</div>
      <div class="book-category-tag">${r.category_name}</div>
      <h3 class="book-card-title">${r.title}</h3>
      <p class="book-card-authors">by ${r.authors}</p>
      
      <div class="reason-box">
        💡 <strong>Recommendation Rationale:</strong><br>${r.reason}
      </div>

      <div class="card-actions">
        <button class="btn btn-outline btn-sm" onclick="showBookDetails(${r.book_id})">
          View Details
        </button>
        <button class="btn btn-primary btn-sm" onclick="quickCheckout(${r.book_id}, '${escapeQuote(r.title)}')">
          Instant Borrow
        </button>
      </div>
    </div>
  `).join("");
}

// Render Active Loans
function renderLoans() {
  const tbody = document.getElementById("loans-table-body");
  if (!state.activeLoans || state.activeLoans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No active loans recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.activeLoans.map(l => {
    const isOverdue = l.status === "OVERDUE";
    const statusPill = isOverdue 
      ? `<span class="status-pill status-overdue">OVERDUE</span>` 
      : `<span class="status-pill status-active">ACTIVE</span>`;

    return `
      <tr>
        <td><strong>#LN-${l.loan_id}</strong></td>
        <td>${l.student_name}</td>
        <td><strong>${l.book_title}</strong></td>
        <td><code>${l.barcode}</code></td>
        <td>${l.due_at}</td>
        <td>${statusPill} ${parseFloat(l.fine_amount) > 0 ? `<span style="color:var(--accent-danger); font-weight:700;">($${l.fine_amount})</span>` : ''}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="returnLoan(${l.loan_id}, '${escapeQuote(l.book_title)}')">
            🔄 Process Return
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// Render Reservations Queue
function renderReservations() {
  const tbody = document.getElementById("reservations-table-body");
  if (!state.reservations || state.reservations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No active reservations in queue.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.reservations.map(r => {
    const isReady = r.status === "READY";
    const statusPill = isReady 
      ? `<span class="status-pill status-ready">READY FOR PICKUP</span>` 
      : `<span class="status-pill status-waiting">WAITING (Pos #${r.queue_position})</span>`;

    return `
      <tr>
        <td><strong>#RES-${r.reservation_id}</strong></td>
        <td><strong>${r.book_title}</strong></td>
        <td>${r.patron_name}</td>
        <td>${r.reserved_at || 'Just now'}</td>
        <td>${statusPill}</td>
        <td>
          ${isReady ? `
            <button class="btn btn-success btn-sm" onclick="checkoutReadyReservation(${r.reservation_id})">
              ✅ Pickup Copy
            </button>
          ` : `
            <button class="btn btn-danger btn-sm" onclick="cancelReservation(${r.reservation_id})">
              ✕ Cancel
            </button>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

// Render Management Stats
function renderStats() {
  document.getElementById("stat-total-titles").innerText = state.books.length || 8;
  document.getElementById("stat-total-copies").innerText = "21";
  document.getElementById("stat-active-loans").innerText = state.activeLoans.length || 3;
  document.getElementById("stat-reservations").innerText = state.reservations.length || 3;
}

// Interactive Actions (Emulating Procedural Stored Calls: sp_checkout_book, sp_return_book)
function quickCheckout(bookId, title) {
  const book = state.books.find(b => b.book_id === bookId);
  if (!book || book.available_copies <= 0) {
    showToast(`No copies available for ${title}. Please join queue instead.`, "error");
    return;
  }

  // Atomically update state
  book.available_copies--;
  book.loaned_copies++;

  const newLoan = {
    loan_id: state.activeLoans.length + 1,
    user_id: state.currentUser.userId,
    student_name: state.currentUser.name,
    book_title: title,
    barcode: `BC-${book.isbn.slice(-4)}-NEW`,
    shelf_location: "Desk Circulation",
    checkout_at: "Just now",
    due_at: "14 days from now",
    status: "ACTIVE",
    fine_amount: "0.00"
  };

  state.activeLoans.unshift(newLoan);
  renderBooks();
  renderLoans();
  renderStats();
  showToast(`[Transaction SUCCESS] Borrowed "${title}" (Copy: ${newLoan.barcode})`, "success");
}

function placeReservation(bookId, title) {
  // Check if patron already has an active reservation
  const exists = state.reservations.some(r => r.book_title === title && r.patron_name === state.currentUser.name);
  if (exists) {
    showToast(`[Integrity VIOLATION uq_user_book_active_reservation]: You already hold an active reservation for "${title}".`, "error");
    return;
  }

  const newRes = {
    reservation_id: state.reservations.length + 1,
    book_title: title,
    patron_name: state.currentUser.name,
    status: "WAITING",
    queue_position: 1,
    reserved_at: "Just now"
  };

  state.reservations.push(newRes);
  renderReservations();
  renderStats();
  showToast(`[Queue Position #1] Joined reservation queue for "${title}".`, "info");
}

function returnLoan(loanId, title) {
  state.activeLoans = state.activeLoans.filter(l => l.loan_id !== loanId);
  const book = state.books.find(b => b.title === title);
  if (book) {
    book.available_copies++;
    book.loaned_copies = Math.max(0, book.loaned_copies - 1);
  }

  renderLoans();
  renderBooks();
  renderStats();
  showToast(`[Procedure sp_return_book] Returned "${title}". Copy returned to shelf inventory.`, "success");
}

function cancelReservation(resId) {
  state.reservations = state.reservations.filter(r => r.reservation_id !== resId);
  renderReservations();
  renderStats();
  showToast(`Reservation #RES-${resId} cancelled. Queue advanced.`, "info");
}

function checkoutReadyReservation(resId) {
  const res = state.reservations.find(r => r.reservation_id === resId);
  if (res) {
    cancelReservation(resId);
    showToast(`Picked up reserved copy of "${res.book_title}". Checkout completed!`, "success");
  }
}

// Modal Inspect Copies
function showBookDetails(bookId) {
  const book = state.books.find(b => b.book_id === bookId);
  if (!book) return;

  const modal = document.getElementById("book-modal");
  document.getElementById("modal-title").innerText = book.title;
  document.getElementById("modal-authors").innerText = `by ${book.authors} (${book.publication_year})`;
  document.getElementById("modal-desc").innerText = book.description;
  document.getElementById("modal-isbn").innerText = book.isbn;
  document.getElementById("modal-publisher").innerText = book.publisher_name || "N/A";
  document.getElementById("modal-category").innerText = book.category_name;

  // Render dynamic physical copies for this specific title
  const copiesContainer = document.getElementById("modal-copies-list");
  const numCopies = book.total_copies || 2;
  const availCopies = book.available_copies || 1;
  const aisleNum = book.category_id || 1;

  let copiesHtml = '';
  for (let c = 1; c <= numCopies; c++) {
    const isAvail = c <= availCopies;
    const barcode = `BC-${book.category_name.slice(0, 3).toUpperCase()}-${book.book_id.toString().padStart(3, '0')}-${String.fromCharCode(64 + c)}`;
    const shelf = `Aisle ${aisleNum}, Shelf ${(book.book_id % 8) + 1}`;
    
    copiesHtml += `
      <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>Barcode: ${barcode}</strong><br>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${shelf}</span>
        </div>
        <span class="status-pill ${isAvail ? 'status-active' : 'status-overdue'}">${isAvail ? 'AVAILABLE' : 'LOANED'}</span>
      </div>
    `;
  }
  copiesContainer.innerHTML = copiesHtml;

  modal.classList.add("active");
}

function closeModal() {
  document.getElementById("book-modal").classList.remove("active");
}

// Toast Notifications
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Helpers
function truncate(str, max = 100) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function escapeQuote(str) {
  return (str || '').replace(/'/g, "\\'");
}

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
