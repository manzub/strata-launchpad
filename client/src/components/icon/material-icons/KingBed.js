import * as React from 'react';

function SvgKingBed(props) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			height='1em'
			viewBox='0 0 24 24'
			width='1em'
			className='svg-icon'
			{...props}>
			<path fill='none' d='M0 0h24v24H0z' />
			<path opacity={0.3} d='M4 12h16v3H4z' />
			<path d='M20 10V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3c-1.1 0-2 .9-2 2v5h1.33L4 19h1l.67-2h12.67l.66 2h1l.67-2H22v-5c0-1.1-.9-2-2-2zm-7-3h5v3h-5V7zM6 7h5v3H6V7zm14 8H4v-3h16v3z' />
		</svg>
	);
}

export default SvgKingBed;
