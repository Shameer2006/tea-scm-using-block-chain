import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Contract configuration - Update these with your deployed contract details
  const CONTRACT_ADDRESS = "0xb7910536dd0d131e829a1b039eaec6db1468c894"; // Replace with your contract address
  const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_productId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_testType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_result",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "_passed",
				"type": "bool"
			}
		],
		"name": "addQualityTest",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "contractId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address[]",
				"name": "parties",
				"type": "address[]"
			}
		],
		"name": "ContractCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "contractId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "enum TeaSupplyChain.ContractStatus",
				"name": "status",
				"type": "uint8"
			}
		],
		"name": "ContractExecuted",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_batchId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_variety",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_origin",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_cultivationMethod",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_processingMethod",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_grade",
				"type": "string"
			},
			{
				"internalType": "string[]",
				"name": "_certifications",
				"type": "string[]"
			},
			{
				"internalType": "string",
				"name": "_ipfsHash",
				"type": "string"
			}
		],
		"name": "createProduct",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "_parties",
				"type": "address[]"
			},
			{
				"internalType": "string",
				"name": "_terms",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_contractType",
				"type": "string"
			}
		],
		"name": "createSmartContract",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_contractId",
				"type": "uint256"
			},
			{
				"internalType": "address payable",
				"name": "_recipient",
				"type": "address"
			}
		],
		"name": "executeContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "productId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "batchId",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "farmer",
				"type": "address"
			}
		],
		"name": "ProductCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "productId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			}
		],
		"name": "ProductTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "productId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "testType",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "passed",
				"type": "bool"
			}
		],
		"name": "QualityTestAdded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "enum TeaSupplyChain.StakeholderType",
				"name": "_type",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "_location",
				"type": "string"
			},
			{
				"internalType": "string[]",
				"name": "_certifications",
				"type": "string[]"
			}
		],
		"name": "registerStakeholder",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "enum TeaSupplyChain.StakeholderType",
				"name": "stakeholderType",
				"type": "uint8"
			}
		],
		"name": "StakeholderRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "transactionId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "productId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "to",
				"type": "address"
			}
		],
		"name": "TransactionCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_productId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_to",
				"type": "address"
			},
			{
				"internalType": "enum TeaSupplyChain.TransactionType",
				"name": "_transactionType",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "_location",
				"type": "string"
			},
			{
				"internalType": "string[]",
				"name": "_documents",
				"type": "string[]"
			},
			{
				"internalType": "string",
				"name": "_conditions",
				"type": "string"
			}
		],
		"name": "transferProduct",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_stakeholder",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_newReputation",
				"type": "uint256"
			}
		],
		"name": "updateReputation",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "contracts",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "terms",
				"type": "string"
			},
			{
				"internalType": "enum TeaSupplyChain.ContractStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "escrowAmount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "createdAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "completedAt",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "contractType",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getProductCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_productId",
				"type": "uint256"
			}
		],
		"name": "getProductHistory",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_productId",
				"type": "uint256"
			}
		],
		"name": "getProductQualityTests",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "productId",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "testType",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "result",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "tester",
						"type": "address"
					},
					{
						"internalType": "bool",
						"name": "passed",
						"type": "bool"
					}
				],
				"internalType": "struct TeaSupplyChain.QualityTest[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_stakeholder",
				"type": "address"
			}
		],
		"name": "getStakeholderProducts",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTransactionCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "productCounter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "productQualityTests",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "productId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "testType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "result",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "tester",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "passed",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "products",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "batchId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "variety",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "origin",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "cultivationMethod",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "harvestDate",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "processingMethod",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "grade",
				"type": "string"
			},
			{
				"internalType": "enum TeaSupplyChain.ProductStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "address",
				"name": "currentOwner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "productTransactions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "stakeholderProducts",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "stakeholders",
		"outputs": [
			{
				"internalType": "address",
				"name": "wallet",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "enum TeaSupplyChain.StakeholderType",
				"name": "stakeholderType",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "reputation",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "transactionCounter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "transactions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "productId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "fromParty",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "toParty",
				"type": "address"
			},
			{
				"internalType": "enum TeaSupplyChain.TransactionType",
				"name": "transactionType",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "conditions",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "isCompleted",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]; // Replace with your contract ABI

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        
        setProvider(provider);
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Initialize contract if address and ABI are provided
        await initializeContract(provider);
        
        toast.success('Wallet connected successfully!');
      } else {
        toast.error('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setIsConnected(false);
    toast.success('Wallet disconnected');
  };

  const registerStakeholder = async (name, type, location, certifications) => {
    if (!contract) {
      toast.error('Contract not initialized');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.registerStakeholder(name, type, location, certifications);
      await tx.wait();
      toast.success('Stakeholder registered successfully!');
      return tx;
    } catch (error) {
      console.error('Error registering stakeholder:', error);
      toast.error('Failed to register stakeholder');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    if (!contract) {
      toast.error('Please connect your wallet and ensure you are on the correct network');
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is registered as a stakeholder
      console.log('Checking stakeholder for account:', account);
      const stakeholder = await contract.stakeholders(account);
      console.log('Stakeholder data:', stakeholder);
      
      if (!stakeholder.isActive) {
        toast.error('Please register as a farmer first in the Profile section');
        console.log('User not registered as stakeholder');
        return;
      }
      
      if (Number(stakeholder.stakeholderType) !== 0) { // 0 = Farmer
        toast.error('Only farmers can create products. Your type: ' + stakeholder.stakeholderType);
        console.log('User stakeholder type:', stakeholder.stakeholderType);
        return;
      }
      
      console.log('User is registered farmer, proceeding with product creation');
      
      const tx = await contract.createProduct(
        productData.batchId,
        productData.variety,
        productData.origin,
        productData.cultivationMethod,
        productData.processingMethod,
        productData.grade,
        productData.certifications,
        productData.ipfsHash || ''
      );
      await tx.wait();
      toast.success('Product created successfully!');
      return tx;
    } catch (error) {
      console.error('Error creating product:', error);
      if (error.message.includes('Only farmers can create products')) {
        toast.error('Only registered farmers can create products');
      } else if (error.message.includes('Only registered stakeholders')) {
        toast.error('Please register as a stakeholder first');
      } else {
        toast.error('Failed to create product: ' + error.message);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const transferProduct = async (productId, toAddress, transactionType, location, documents, conditions) => {
    if (!contract) {
      toast.error('Contract not initialized');
      return;
    }

    try {
      setLoading(true);
      
      // Validate that the current user owns the product
      const product = await contract.products(productId);
      if (product.currentOwner.toLowerCase() !== account.toLowerCase()) {
        toast.error('You can only transfer products that you own');
        return;
      }
      
      // Validate recipient is registered
      const recipient = await contract.stakeholders(toAddress);
      if (!recipient.isActive) {
        toast.error('Recipient is not a registered stakeholder');
        return;
      }
      
      console.log('Transferring product:', {
        productId,
        from: account,
        to: toAddress,
        transactionType,
        location
      });
      
      const tx = await contract.transferProduct(productId, toAddress, transactionType, location, documents || [], conditions || '');
      await tx.wait();
      toast.success('Product transferred successfully!');
      return tx;
    } catch (error) {
      console.error('Error transferring product:', error);
      if (error.message.includes('Only product owner')) {
        toast.error('You can only transfer products that you own');
      } else if (error.message.includes('not a registered stakeholder')) {
        toast.error('Recipient is not a registered stakeholder');
      } else {
        toast.error('Failed to transfer product: ' + (error.reason || error.message || 'Unknown error'));
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getProduct = async (productId) => {
    if (!contract) return null;
    
    try {
      const product = await contract.products(productId);
      return product;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  };

  const getProductHistory = async (productId) => {
    if (!contract) return [];
    
    try {
      const transactionIds = await contract.getProductHistory(productId);
      const transactions = [];
      
      for (let i = 0; i < transactionIds.length; i++) {
        const tx = await contract.transactions(transactionIds[i]);
        transactions.push(tx);
      }
      
      return transactions;
    } catch (error) {
      console.error('Error fetching product history:', error);
      return [];
    }
  };

  const getStakeholder = async (address) => {
    if (!contract) return null;
    
    try {
      const stakeholder = await contract.stakeholders(address || account);
      return stakeholder;
    } catch (error) {
      console.error('Error fetching stakeholder:', error);
      return null;
    }
  };

  const checkStakeholderStatus = async (address) => {
    if (!contract) {
      console.log('Contract not initialized');
      return { isRegistered: false, type: null, name: null };
    }
    
    try {
      const stakeholder = await contract.stakeholders(address || account);
      console.log('Stakeholder check for', address || account, ':', stakeholder);
      
      const isRegistered = stakeholder.isActive && stakeholder.wallet !== '0x0000000000000000000000000000000000000000';
      const stakeholderTypes = ['Farmer', 'Processor', 'Exporter', 'Importer', 'Retailer', 'Regulator'];
      
      return {
        isRegistered,
        type: isRegistered ? stakeholderTypes[Number(stakeholder.stakeholderType)] : null,
        name: isRegistered ? stakeholder.name : null,
        typeIndex: isRegistered ? Number(stakeholder.stakeholderType) : null
      };
    } catch (error) {
      console.error('Error checking stakeholder status:', error);
      return { isRegistered: false, type: null, name: null };
    }
  };

  const getAllProducts = async () => {
    if (!contract) return [];
    
    try {
      const productCount = await contract.getProductCount();
      const products = [];
      
      for (let i = 1; i <= productCount; i++) {
        const product = await contract.products(i);
        if (product.id > 0) {
          products.push({
            id: Number(product.id),
            batchId: product.batchId,
            variety: product.variety,
            origin: product.origin,
            cultivationMethod: product.cultivationMethod,
            processingMethod: product.processingMethod,
            grade: product.grade,
            status: ['Harvested', 'Processed', 'InTransit', 'Delivered', 'Sold'][product.status],
            harvestDate: new Date(Number(product.harvestDate) * 1000).toISOString(),
            currentOwner: product.currentOwner,
            certifications: [] // Note: certifications array needs special handling
          });
        }
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  const getUserProducts = async (userAddress) => {
    if (!contract) return [];
    
    try {
      const productIds = await contract.getStakeholderProducts(userAddress || account);
      const products = [];
      
      for (let i = 0; i < productIds.length; i++) {
        const product = await contract.products(productIds[i]);
        if (product.id > 0) {
          products.push({
            id: Number(product.id),
            batchId: product.batchId,
            variety: product.variety,
            origin: product.origin,
            cultivationMethod: product.cultivationMethod,
            processingMethod: product.processingMethod,
            grade: product.grade,
            status: ['Harvested', 'Processed', 'InTransit', 'Delivered', 'Sold'][product.status],
            harvestDate: new Date(Number(product.harvestDate) * 1000).toISOString(),
            currentOwner: product.currentOwner,
            certifications: [] // Note: certifications array needs special handling
          });
        }
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching user products:', error);
      return [];
    }
  };

  // Function to initialize contract with current signer
  const initializeContract = async (provider) => {
    try {
      if (CONTRACT_ADDRESS && CONTRACT_ABI.length > 0 && provider) {
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);
        console.log('Contract initialized with new signer:', await signer.getAddress());
        return contractInstance;
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
      setContract(null);
    }
    return null;
  };

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setProvider(provider);
            setAccount(accounts[0].address);
            setIsConnected(true);
            // Initialize contract with current account
            await initializeContract(provider);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          console.log('Account changed to:', accounts[0]);
          setAccount(accounts[0]);
          // Re-initialize contract with new account
          if (provider) {
            await initializeContract(provider);
          }
          toast.success('Account switched successfully!');
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [provider]);

  const value = {
    account,
    provider,
    contract,
    isConnected,
    loading,
    connectWallet,
    disconnectWallet,
    registerStakeholder,
    createProduct,
    transferProduct,
    getProduct,
    getProductHistory,
    getStakeholder,
    getAllProducts,
    getUserProducts,
    checkStakeholderStatus,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};