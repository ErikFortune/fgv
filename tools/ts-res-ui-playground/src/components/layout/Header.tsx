import React from 'react';
import { AppHeader } from '@fgv/ts-res-ui-components';
import { RectangleStackIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <AppHeader
      icon={RectangleStackIcon}
      title="TS-RES UI Playground"
      description="Development and testing environment for ts-res UI components"
    />
  );
};

export default Header;
