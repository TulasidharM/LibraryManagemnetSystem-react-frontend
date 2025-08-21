export const addBookService = async (bookData) =>{
        const response = await fetch('http://localhost:8080/addbook', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        } 
        return data;
}

