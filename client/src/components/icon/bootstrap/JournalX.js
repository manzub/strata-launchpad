import * as React from 'react';

function SvgJournalX(props) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='1em'
			height='1em'
			fill='currentColor'
			className='svg-icon'
			viewBox='0 0 16 16'
			{...props}>
			<path
				fillRule='evenodd'
				d='M6.146 6.146a.5.5 0 01.708 0L8 7.293l1.146-1.147a.5.5 0 11.708.708L8.707 8l1.147 1.146a.5.5 0 01-.708.708L8 8.707 6.854 9.854a.5.5 0 01-.708-.708L7.293 8 6.146 6.854a.5.5 0 010-.708z'
			/>
			<path d='M3 0h10a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2v-1h1v1a1 1 0 001 1h10a1 1 0 001-1V2a1 1 0 00-1-1H3a1 1 0 00-1 1v1H1V2a2 2 0 012-2z' />
			<path d='M1 5v-.5a.5.5 0 011 0V5h.5a.5.5 0 010 1h-2a.5.5 0 010-1H1zm0 3v-.5a.5.5 0 011 0V8h.5a.5.5 0 010 1h-2a.5.5 0 010-1H1zm0 3v-.5a.5.5 0 011 0v.5h.5a.5.5 0 010 1h-2a.5.5 0 010-1H1z' />
		</svg>
	);
}

export default SvgJournalX;
