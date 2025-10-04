import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatWidget from './ChatWidget';

// Mock the Web3Context
jest.mock('../context/Web3Context', () => ({
  useWeb3: () => ({
    account: '0x1234567890123456789012345678901234567890',
    checkStakeholderStatus: jest.fn().mockResolvedValue({
      isRegistered: true,
      type: 'Farmer',
      name: 'Test Farmer'
    })
  })
}));

describe('ChatWidget', () => {
  test('renders chat button when closed', () => {
    render(<ChatWidget />);
    
    // Should show the floating chat button
    const chatButton = screen.getByRole('button');
    expect(chatButton).toBeInTheDocument();
  });

  test('renders without crashing with props', () => {
    render(
      <ChatWidget 
        productId="TEA001" 
        ownerAddress="0x1234567890123456789012345678901234567890"
      />
    );
    
    // Should render without errors
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});