import React from 'react';
import PropTypes from 'prop-types';

const Cell = (props) => {
  const { classList } = props;
  const className = 'cell' + classList.reduce((acc, cur) => acc + ' ' + cur, '');
  if (classList.includes('falling') || classList.includes('dropping')) {
    const { style, onAnimationEnd } = props;
    return <div className={className} style={style} onAnimationEnd={onAnimationEnd} />;
  }
  return <div className={className} />;
};

const {
  number,
  arrayOf,
  string,
  objectOf,
  func,
} = PropTypes;
Cell.propTypes = {
  classList: arrayOf(string).isRequired,
  style: objectOf(number),
  onAnimationEnd: func,
};

export default Cell;
