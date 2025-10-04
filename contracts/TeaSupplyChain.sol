// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TeaSupplyChain {
    address public owner;
    uint256 public productCounter;
    uint256 public transactionCounter;
    
    enum StakeholderType { Farmer, Processor, Exporter, Importer, Retailer, Regulator }
    enum TransactionType { Harvest, Processing, Export, Import, Retail }
    enum ProductStatus { Harvested, Processed, InTransit, Delivered, Sold }
    enum ContractStatus { Active, Completed, Disputed, Cancelled }
    
    struct Stakeholder {
        address wallet;
        string name;
        StakeholderType stakeholderType;
        string location;
        string[] certifications;
        bool isActive;
        uint256 reputation;
    }
    
    struct TeaProduct {
        uint256 id;
        string batchId;
        string variety;
        string origin;
        string cultivationMethod;
        uint256 harvestDate;
        string processingMethod;
        string grade;
        ProductStatus status;
        address currentOwner;
        string[] certifications;
        string ipfsHash;
    }
    
    struct SupplyTransaction {
        uint256 id;
        uint256 productId;
        address fromParty;
        address toParty;
        TransactionType transactionType;
        string location;
        uint256 timestamp;
        string[] documents;
        string conditions;
        bool isCompleted;
    }
    
    struct SmartContract {
        uint256 id;
        address[] parties;
        string terms;
        ContractStatus status;
        uint256 escrowAmount;
        uint256 createdAt;
        uint256 completedAt;
        string contractType;
    }
    
    struct QualityTest {
        uint256 productId;
        string testType;
        string result;
        uint256 timestamp;
        address tester;
        bool passed;
    }
    
    mapping(address => Stakeholder) public stakeholders;
    mapping(uint256 => TeaProduct) public products;
    mapping(uint256 => SupplyTransaction) public transactions;
    mapping(uint256 => SmartContract) public contracts;
    mapping(uint256 => QualityTest[]) public productQualityTests;
    mapping(address => uint256[]) public stakeholderProducts;
    mapping(uint256 => uint256[]) public productTransactions;
    
    event StakeholderRegistered(address indexed wallet, string name, StakeholderType stakeholderType);
    event ProductCreated(uint256 indexed productId, string batchId, address indexed farmer);
    event TransactionCreated(uint256 indexed transactionId, uint256 indexed productId, address indexed from, address to);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to);
    event QualityTestAdded(uint256 indexed productId, string testType, bool passed);
    event ContractCreated(uint256 indexed contractId, address[] parties);
    event ContractExecuted(uint256 indexed contractId, ContractStatus status);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyRegistered() {
        require(stakeholders[msg.sender].isActive, "Only registered stakeholders can call this function");
        _;
    }
    
    modifier onlyProductOwner(uint256 _productId) {
        require(products[_productId].currentOwner == msg.sender, "Only product owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        productCounter = 0;
        transactionCounter = 0;
    }
    
    function registerStakeholder(
        string memory _name,
        StakeholderType _type,
        string memory _location,
        string[] memory _certifications
    ) public {
        require(!stakeholders[msg.sender].isActive, "Stakeholder already registered");
        
        stakeholders[msg.sender] = Stakeholder({
            wallet: msg.sender,
            name: _name,
            stakeholderType: _type,
            location: _location,
            certifications: _certifications,
            isActive: true,
            reputation: 100
        });
        
        emit StakeholderRegistered(msg.sender, _name, _type);
    }
    
    function createProduct(
        string memory _batchId,
        string memory _variety,
        string memory _origin,
        string memory _cultivationMethod,
        string memory _processingMethod,
        string memory _grade,
        string[] memory _certifications,
        string memory _ipfsHash
    ) public onlyRegistered {
        require(stakeholders[msg.sender].stakeholderType == StakeholderType.Farmer, "Only farmers can create products");
        
        productCounter++;
        
        products[productCounter] = TeaProduct({
            id: productCounter,
            batchId: _batchId,
            variety: _variety,
            origin: _origin,
            cultivationMethod: _cultivationMethod,
            harvestDate: block.timestamp,
            processingMethod: _processingMethod,
            grade: _grade,
            status: ProductStatus.Harvested,
            currentOwner: msg.sender,
            certifications: _certifications,
            ipfsHash: _ipfsHash
        });
        
        stakeholderProducts[msg.sender].push(productCounter);
        
        emit ProductCreated(productCounter, _batchId, msg.sender);
    }
    
    function transferProduct(
        uint256 _productId,
        address _to,
        TransactionType _transactionType,
        string memory _location,
        string[] memory _documents,
        string memory _conditions
    ) public onlyProductOwner(_productId) {
        require(stakeholders[_to].isActive, "Recipient is not a registered stakeholder");
        
        transactionCounter++;
        
        transactions[transactionCounter] = SupplyTransaction({
            id: transactionCounter,
            productId: _productId,
            fromParty: msg.sender,
            toParty: _to,
            transactionType: _transactionType,
            location: _location,
            timestamp: block.timestamp,
            documents: _documents,
            conditions: _conditions,
            isCompleted: true
        });
        
        products[_productId].currentOwner = _to;
        
        if (_transactionType == TransactionType.Processing) {
            products[_productId].status = ProductStatus.Processed;
        } else if (_transactionType == TransactionType.Export || _transactionType == TransactionType.Import) {
            products[_productId].status = ProductStatus.InTransit;
        } else if (_transactionType == TransactionType.Retail) {
            products[_productId].status = ProductStatus.Sold;
        }
        
        stakeholderProducts[_to].push(_productId);
        productTransactions[_productId].push(transactionCounter);
        
        emit TransactionCreated(transactionCounter, _productId, msg.sender, _to);
        emit ProductTransferred(_productId, msg.sender, _to);
    }
    
    function addQualityTest(
        uint256 _productId,
        string memory _testType,
        string memory _result,
        bool _passed
    ) public onlyRegistered {
        require(products[_productId].id != 0, "Product does not exist");
        
        productQualityTests[_productId].push(QualityTest({
            productId: _productId,
            testType: _testType,
            result: _result,
            timestamp: block.timestamp,
            tester: msg.sender,
            passed: _passed
        }));
        
        emit QualityTestAdded(_productId, _testType, _passed);
    }
    
    function createSmartContract(
        address[] memory _parties,
        string memory _terms,
        string memory _contractType
    ) public payable onlyRegistered {
        uint256 contractId = block.timestamp;
        
        contracts[contractId] = SmartContract({
            id: contractId,
            parties: _parties,
            terms: _terms,
            status: ContractStatus.Active,
            escrowAmount: msg.value,
            createdAt: block.timestamp,
            completedAt: 0,
            contractType: _contractType
        });
        
        emit ContractCreated(contractId, _parties);
    }
    
    function executeContract(uint256 _contractId, address payable _recipient) public {
        SmartContract storage contractData = contracts[_contractId];
        require(contractData.status == ContractStatus.Active, "Contract is not active");
        
        bool isParty = false;
        for (uint i = 0; i < contractData.parties.length; i++) {
            if (contractData.parties[i] == msg.sender) {
                isParty = true;
                break;
            }
        }
        require(isParty, "Only contract parties can execute");
        
        contractData.status = ContractStatus.Completed;
        contractData.completedAt = block.timestamp;
        
        if (contractData.escrowAmount > 0) {
            _recipient.transfer(contractData.escrowAmount);
        }
        
        emit ContractExecuted(_contractId, ContractStatus.Completed);
    }
    
    function getProductHistory(uint256 _productId) public view returns (uint256[] memory) {
        return productTransactions[_productId];
    }
    
    function getStakeholderProducts(address _stakeholder) public view returns (uint256[] memory) {
        return stakeholderProducts[_stakeholder];
    }
    
    function getProductQualityTests(uint256 _productId) public view returns (QualityTest[] memory) {
        return productQualityTests[_productId];
    }
    
    function updateReputation(address _stakeholder, uint256 _newReputation) public onlyOwner {
        stakeholders[_stakeholder].reputation = _newReputation;
    }
    
    function getProductCount() public view returns (uint256) {
        return productCounter;
    }
    
    function getTransactionCount() public view returns (uint256) {
        return transactionCounter;
    }
}