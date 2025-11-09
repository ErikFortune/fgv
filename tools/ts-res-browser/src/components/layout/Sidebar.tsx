import React from 'react';
import { AppSidebar } from '@fgv/ts-res-ui-components';
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  FunnelIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Tool } from '../../types/app';

interface SidebarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

const tools = [
  {
    id: 'import' as Tool,
    name: 'Import Resources',
    icon: DocumentArrowUpIcon,
    description: 'Import resource files, directories, bundles, and ZIP archives'
  },
  {
    id: 'source' as Tool,
    name: 'Source Browser',
    icon: DocumentTextIcon,
    description: 'Browse built resources in alphabetical order'
  },
  {
    id: 'filter' as Tool,
    name: 'Filter Tool',
    icon: FunnelIcon,
    description: 'Filter resources by context for focused analysis'
  },
  {
    id: 'compiled' as Tool,
    name: 'Compiled Browser',
    icon: CubeIcon,
    description: 'Navigate compiled resources in tree view'
  },
  {
    id: 'resolution' as Tool,
    name: 'Resolution Viewer',
    icon: MagnifyingGlassIcon,
    description: 'View resource resolution with qualifiers'
  },
  {
    id: 'configuration' as Tool,
    name: 'Configuration',
    icon: CogIcon,
    description: 'Manage qualifier types, qualifiers, and resource types'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ selectedTool, onToolSelect }) => {
  return <AppSidebar<Tool> selectedTool={selectedTool} onToolSelect={onToolSelect} tools={tools} />;
};

export default Sidebar;
