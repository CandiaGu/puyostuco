import React from 'react';

const Button = ({ className, text, onClick }) => (
  <a
    className={className}
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onClick();
        }
      }
    }
  >
    <h2>{text}</h2>
  </a>
);

export default Button;
