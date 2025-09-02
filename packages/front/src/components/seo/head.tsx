import { Helmet, HelmetData } from 'react-helmet-async';

type HeadProps = {
  title?: string;
  description?: string;
};

const helmetData = new HelmetData({});

export const Head = ({ title = '', description = '' }: HeadProps = {}) => {
  return (
    <Helmet
      defaultTitle="Bulletproof React"
      helmetData={helmetData}
      title={title ? `${title} | Bulletproof React` : undefined}
    >
      <meta content={description} name="description" />
    </Helmet>
  );
};
