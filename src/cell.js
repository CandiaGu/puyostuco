import React from 'react';
import PropTypes from 'prop-types';

const Cell = (props) => {
  const {
    classList,
    style,
    onAnimationEnd,
    Component,
  } = props;
  const className = `cell${classList.reduce((acc, cur) => `${acc} ${cur}`, '')}`;
  return <div className={className} style={style} onAnimationEnd={onAnimationEnd}>{Component}</div>;
};

const {
  number,
  arrayOf,
  string,
  objectOf,
  oneOfType,
  func,
  node,
} = PropTypes;

Cell.propTypes = {
  classList: arrayOf(string).isRequired,
  style: objectOf(oneOfType([number, string])),
  onAnimationEnd: func,
  Component: node,
};

Cell.defaultProps = {
  style: undefined,
  onAnimationEnd: undefined,
  Component: undefined,
};

export default Cell;
