import React from 'react';
import { AppHeader } from '@fgv/ts-res-ui-components';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <AppHeader
      icon={DocumentMagnifyingGlassIcon}
      title="TS-RES Browser"
      description="Visual tool for loading, browsing, and experimenting with ts-res resources"
    />
  );
};

export default Header;
