import React from 'react';
import PropTypes from 'prop-types';
import { IconContext } from 'react-icons';
import { FaStar } from 'react-icons/fa';
import { IoMdMoon } from 'react-icons/io';
import { AiFillCrown } from 'react-icons/ai';
import { GiCometSpark } from 'react-icons/gi';
import Cell from './cell.js';

const Garbage = ({ garbagePending }) => {
  const symbols = [
    { garbage: 1, symbol: <Cell classList={['gray', 'ghost', 'garbage']} /> },
    { garbage: 6, symbol: <Cell classList={['gray', 'garbage']} /> },
    { garbage: 30, symbol: <Cell classList={['red', 'garbage']} /> },
    {
      garbage: 180,
      symbol: (
        <IconContext.Provider value={{ color: 'yellow', className: 'garbage' }}>
          <FaStar />
        </IconContext.Provider>
      ),
    },
    {
      garbage: 360,
      symbol: (
        <IconContext.Provider
          value={{
            color: 'yellow',
            className: 'garbage',
            style: { transform: 'scaleX(-1)' },
          }}
        >
          <IoMdMoon />
        </IconContext.Provider>
      ),
    },
    {
      garbage: 720,
      symbol: (
        <IconContext.Provider value={{ color: 'yellow', className: 'garbage' }}>
          <AiFillCrown />
        </IconContext.Provider>
      ),
    },
    {
      garbage: 1440,
      symbol: (
        <IconContext.Provider
          value={{
            color: 'cyan',
            className: 'garbage',
            style: { transform: 'scaleX(-1)' },
          }}
        >
          <GiCometSpark />
        </IconContext.Provider>
      ),
    },
  ];
  const traySize = 6;
  const tray = [];
  for (let i = 0, garbageRemaining = garbagePending; i < traySize && garbageRemaining > 0; i++) {
    const index = symbols.findIndex(({ garbage }) => garbage > garbageRemaining);
    const symbol = index === -1 ? symbols[symbols.length - 1] : symbols[index - 1];
    garbageRemaining -= symbol.garbage;
    tray.push(React.cloneElement(symbol.symbol, { key: i + '' + index }));
  }
  return (
    <div className="garbage-tray">
      {tray}
    </div>
  );
};

const {
  number,
} = PropTypes;

Garbage.propTypes = {
  garbagePending: number.isRequired,
};

export default Garbage;
