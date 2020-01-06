import React from 'react';
import PropTypes from 'prop-types';

const Cell = (props) => {
  const {
    classList,
    style,
    onAnimationEnd,
    chainNum,
  } = props;
  const className = 'cell' + classList.reduce((acc, cur) => acc + ' ' + cur, '');
  return (
    <div className={className} style={style} onAnimationEnd={onAnimationEnd}>
      {chainNum && <div className="chain-text">{chainNum + '-chain!'}</div>}
    </div>
  );
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
  chainNum: number,
};

export default Cell;
