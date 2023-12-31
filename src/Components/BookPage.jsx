import React, { useEffect, useState } from 'react';
import '../Css/BookPage.css';
import { useParams, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { useFormik } from "formik";
import SweetAlert2 from "sweetalert2"

export default function BookPage() {
  const book_id = useParams(); 
  const navigate = useNavigate();
  const [book, setBook] = useState({});
  const [fetchEr, setFetchEr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messageError, setMessageErrors] = useState(null);
  const [selectedRating, setSelectedRating] = useState(1);

  let mytoken = localStorage.getItem('loginToken');
  let user_id = localStorage.getItem('user_id');  

  useEffect(() => {
    setLoading(true);

    fetch(`https://storycircleserver.onrender.com/books/${book_id.index}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mytoken}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Kindly check your network and reload again.');
        } else if (res.status === 500 || res.status === 404 || res.status === 401) {
          return res.json().then(data => {
            throw new Error(data.message);
          });
        }
        return res.json();
      })
      .then((data) => {
        setBook(data);
      })
      .catch((error) => {
        setFetchEr(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [book_id.index, mytoken]);

  const formSchema = yup.object().shape({
    comment: yup.string().required('Comment is required'),
  });
  

  const formik = useFormik({
    initialValues: {
      comment: '',
    },
    validationSchema: formSchema,
    onSubmit: async (values) => {

      if (user_id === null) {
        SweetAlert2.fire({
          title: "Login Required",
          text: "You need to login to leave a comment on a book.",
          icon: "warning",
          showConfirmButton: false,
          timer: 3000, // Close after 3 seconds
        });

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return; 
      }
      let valuesToSend = {
        ...values,
        user_id: parseInt(user_id),
        book_id: parseInt(book_id.index),
        rating: selectedRating, 
      };
      
      try {
        let resp = await fetch("https://storycircleserver.onrender.com/bookcomments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mytoken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(valuesToSend, null, 2),
        });

        if (resp.ok) {
          formik.resetForm();
          setSelectedRating(1); 
          window.location.reload(); 
        } else {
          let errorData = await resp.json();
          if (resp.status === 500 || resp.status === 401) {
            // Internal Server Error - Database error
            setMessageErrors("Error in server");
          } else {
            setMessageErrors(errorData.message);
          }
        }
      } catch (error) {
        console.error("Network error:", error);
      }
    },
  });

  function getStars(rating) {
    const maxRating = 5;
    const blackStar = "★";
    const emptyStar = "☆";

    if (rating < 1 || rating > maxRating) {
        throw new Error("Rating should be between 1 and 5.");
    }

    const fullStars = blackStar.repeat(Math.floor(rating));
    const remainingStars = emptyStar.repeat(maxRating - Math.floor(rating));

    return fullStars + remainingStars;
  }

  function handleStarClick(rating) {
    if (selectedRating === rating) {
      setSelectedRating(null); // Deselect if clicked again
    } else {
      setSelectedRating(rating);
    }
  }


  return (
<>
    {loading ? (
      <div>Loading...</div>
    ) : fetchEr ? (
      <div className="error-message">{fetchEr.message}</div>
    ) : (
      <div className='main-book-div'>
        <div className='image-title-div-books'>
          <h1>{book.title}</h1>
        </div>
        <div className='book-info-div'>
          <h2 style={{ fontSize:'45px' }}>   {book.author}</h2>
          <p style={{ fontSize:'18px' }}>{book.description}</p>
        </div>
        <div className='book-comments-div'>
          <div className='comments-holder'>
            <div className='title-div'>
              <h1>Comments</h1>
            </div>
            <div className='comments-holder'>
              {book.comments && (
                book.comments.map(comment => (
                  <div key={comment.id}>
                    <p>User: {comment.username}</p>
                    <p>Comment: {comment.comment}</p>
                    <p>Rating: {getStars(comment.rating)}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={formik.handleSubmit}>
              <div className="input-container">
                <label htmlFor="comment">Comment</label>
                <br />
                <input
                  id="comment"
                  name="comment"
                  onChange={formik.handleChange}
                  value={formik.values.comment}
                />
                <label htmlFor="rating">Rating</label>
                <br />
                <div>
                {[1, 2, 3, 4, 5].map((rating) => (
                <span
                  key={rating}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleStarClick(rating)}
                 >
                  {rating <= selectedRating ? '★' : '☆'}
                  </span>
                  ))}
               </div>
                <button type="submit">Add comment</button>
              </div>
              {formik.touched.comment && formik.errors.comment ? (
                <div style={{ color: 'red' }}>{formik.errors.comment}</div>
              ) : null}
              {/* {formik.touched.rating && formik.errors.rating ? (
                <div style={{ color: 'red' }}>{formik.errors.rating}</div>
              ) : null} */}
            </form>
          </div>
        </div>
      </div>
    )}
  </>
);

}