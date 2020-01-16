import React from 'react';
import PropTypes from 'prop-types';

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
    }}
  >
    <h2>{text}</h2>
  </a>
);

const {
  string,
  func,
} = PropTypes;

Button.propTypes = {
  className: string.isRequired,
  text: string.isRequired,
  onClick: func.isRequired,
};

export default Button;
