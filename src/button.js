import React from 'react';
import PropTypes from 'prop-types';

const Button = (props) => {
  const {
    className,
    text,
    onClick,
    onDelete,
  } = props;
  return (
    <a
      className={className}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onClick();
        } else if (!!onDelete && e.key === 'Delete') {
          onDelete();
        }
      }}
    >
      <h2>{text}</h2>
    </a>
  );
}

const {
  string,
  func,
} = PropTypes;

Button.propTypes = {
  className: string.isRequired,
  text: string.isRequired,
  onClick: func.isRequired,
  onDelete: func,
};

Button.defaultProps = {
  onDelete: undefined,
};

export default Button;
