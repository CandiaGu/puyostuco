import React from 'react';
import PropTypes from 'prop-types';

const Cell = (props) => {
  const {
    classList,
    style,
    onAnimationEnd,
    children,
  } = props;
  const className = `cell${classList.reduce((acc, cur) => `${acc} ${cur}`, '')}`;
  return <div className={className} style={style} onAnimationEnd={onAnimationEnd}>{children}</div>;
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
  children: node,
};

Cell.defaultProps = {
  style: undefined,
  onAnimationEnd: undefined,
  children: undefined,
};

export default Cell;
