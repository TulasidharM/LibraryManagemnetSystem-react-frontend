import React, { useState, useEffect } from 'react';
import './ReturnBook.css';

const ReturnBook = () => {
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    selectedMember: '',
    email: '',
    selectedBook: ''
  });
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedMemberDetails, setSelectedMemberDetails] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('http://localhost:8080/getallmembers');
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.email) return;

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/issued-records');
      if (!response.ok) throw new Error('Failed to fetch records');
      
      const records = await response.json();
      
      // First find member with matching email
      const memberResponse = await fetch(`http://localhost:8080/searchmember?email=${formData.email}`);
      if (!memberResponse.ok) throw new Error('Member not found');
      
      const member = await memberResponse.json();
      setSelectedMemberDetails(member);
      
      // Filter records for this member and status 'I' (issued)
      const memberBooks = records.filter(record => 
        record.memberId === member.member_Id && 
        record.status === 'I'
      );

      if (memberBooks.length === 0) {
        throw new Error('No books currently issued to this member');
      }

      // Fetch book details for each issued book
      const booksResponse = await fetch('http://localhost:8080/getallbooks');
      if (!booksResponse.ok) throw new Error('Failed to fetch books');
      const booksData = await booksResponse.json();

      // Create a lookup map for books
      const booksMap = booksData.reduce((acc, book) => {
        acc[book.book_Id] = book;
        return acc;
      }, {});

      // Combine issue records with book details
      // First update the issuedBooksWithDetails to include bookId
      const issuedBooksWithDetails = memberBooks.map(record => ({
        issueId: record.issueId,
        bookId: record.bookId,
        bookTitle: booksMap[record.bookId]?.book_Title || 'Unknown Book',
        issueDate: record.issueDate
      }));

      setIssuedBooks(issuedBooksWithDetails);
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setIssuedBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Then update the handleReturn function
  const handleReturn = async (e) => {
    e.preventDefault();
    if (!formData.selectedBook) {
      setMessage({ type: 'error', text: 'Please select a book to return' });
      return;
    }

    try {
      setIsLoading(true);
      const selectedIssue = issuedBooks.find(book => book.issueId.toString() === formData.selectedBook);
      
      const response = await fetch(`http://localhost:8080/returnbook?issueId=${formData.selectedBook}&bookId=${selectedIssue.bookId}`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to return book');
      
      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      setFormData({ selectedMember: '', email: '', selectedBook: '' });
      setSelectedMemberDetails(null);
      setIssuedBooks([]);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setFormData({ selectedMember: '', email: '', selectedBook: '' });
    setIssuedBooks([]);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="return-book-container">
      <h2>Return Book</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form className="return-book-form">
        <div className="return-book-form-group">
          <label>Selected Member</label>
          {selectedMemberDetails ? (
            <div className="member-details">
              <p><strong>Name:</strong> {selectedMemberDetails.member_Name}</p>
              <p><strong>Email:</strong> {selectedMemberDetails.email}</p>
            </div>
          ) : (
            <p className="no-member-selected">No member selected</p>
          )}
        </div>

        <div className="search-group">
          <div className="input-container">
            <label htmlFor="email">Or Enter Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              pattern="^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
            />
          </div>
          <button 
            type="button" 
            onClick={handleSearch}
            disabled={isLoading}
            className="return-book-button"
          >
            Search
          </button>
        </div>

        <div className="return-book-form-group">
          <label htmlFor="selectedBook">Select Book</label>
          <select
            id="selectedBook"
            name="selectedBook"
            value={formData.selectedBook}
            onChange={handleChange}
          >
            <option value="" disabled>Choose a book</option>
            {issuedBooks.map(book => (
              <option key={book.issueId} value={book.issueId}>
                {book.bookTitle}
              </option>
            ))}
          </select>
        </div>

        <div className="button-group">
          <button
            type="submit"
            onClick={handleReturn}
            disabled={isLoading}
            className="return-book-submit"
          >
            Return
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="return-book-button secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReturnBook;
