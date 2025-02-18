import React from 'react';

interface XHTMLDivProps extends React.HTMLAttributes<HTMLDivElement> {
  xmlns: string;
}

const XHTMLDiv: React.FC<XHTMLDivProps> = ({ xmlns, ...props }) => {
  return <div {...props} xmlns={xmlns} />;
};

export default XHTMLDiv;
