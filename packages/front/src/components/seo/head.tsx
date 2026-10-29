import { Helmet, HelmetData } from 'react-helmet-async';

type HeadProps = {
  title?: string;
  description?: string;
};

const helmetData = new HelmetData({});

export const Head = ({ title = '', description = '' }: HeadProps = {}) => {
  return (
    <Helmet
      defaultTitle="MTGdle"
      helmetData={helmetData}
      title={title ? `${title} | MTGdle` : undefined}
    >
      <meta content={description} name="description" />
    </Helmet>
  );
};
