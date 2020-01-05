import React from 'react';
import PropTypes from 'prop-types';

const Cell = (props) => {
  const { classList, style, onAnimationEnd } = props;
  const className = 'cell' + classList.reduce((acc, cur) => acc + ' ' + cur, '');
  return <div className={className} style={style} onAnimationEnd={onAnimationEnd} />;
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
