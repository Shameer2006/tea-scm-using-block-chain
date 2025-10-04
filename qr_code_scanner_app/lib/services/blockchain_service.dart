import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:web3dart/web3dart.dart';

class BlockchainService {
  static const String contractAddress = "0xYourContractAddress"; // Replace with actual address
  static const String rpcUrl = "https://sepolia.infura.io/v3/your_infura_id";
  
  static const String contractAbi = '''[
    {
      "inputs": [{"internalType": "string", "name": "_batchId", "type": "string"}],
      "name": "getProduct",
      "outputs": [
        {"internalType": "string", "name": "batchId", "type": "string"},
        {"internalType": "string", "name": "name", "type": "string"},
        {"internalType": "string", "name": "productType", "type": "string"},
        {"internalType": "string", "name": "harvestLocation", "type": "string"},
        {"internalType": "uint256", "name": "harvestDate", "type": "uint256"},
        {"internalType": "address", "name": "currentOwner", "type": "address"},
        {"internalType": "uint8", "name": "currentStage", "type": "uint8"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "string", "name": "_batchId", "type": "string"}],
      "name": "getProductTransactions",
      "outputs": [
        {"internalType": "address[]", "name": "from", "type": "address[]"},
        {"internalType": "address[]", "name": "to", "type": "address[]"},
        {"internalType": "uint256[]", "name": "timestamp", "type": "uint256[]"},
        {"internalType": "uint8[]", "name": "transactionType", "type": "uint8[]"}
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]''';

  late Web3Client _client;
  late DeployedContract _contract;

  BlockchainService() {
    _client = Web3Client(rpcUrl, http.Client());
    _contract = DeployedContract(
      ContractAbi.fromJson(contractAbi, 'TeaSupplyChain'),
      EthereumAddress.fromHex(contractAddress),
    );
  }

  Future<Map<String, dynamic>?> getProduct(String batchId) async {
    try {
      final function = _contract.function('getProduct');
      final result = await _client.call(
        contract: _contract,
        function: function,
        params: [batchId],
      );

      if (result.isNotEmpty) {
        return {
          'batchId': result[0],
          'name': result[1],
          'productType': result[2],
          'harvestLocation': result[3],
          'harvestDate': DateTime.fromMillisecondsSinceEpoch(
            (result[4] as BigInt).toInt() * 1000,
          ).toIso8601String().split('T')[0],
          'currentOwner': (result[5] as EthereumAddress).hex,
          'currentStage': result[6],
        };
      }
      return null;
    } catch (e) {
      print('Error fetching product: $e');
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getProductTransactions(String batchId) async {
    try {
      final function = _contract.function('getProductTransactions');
      final result = await _client.call(
        contract: _contract,
        function: function,
        params: [batchId],
      );

      List<Map<String, dynamic>> transactions = [];
      
      if (result.isNotEmpty && result[0] is List) {
        final fromAddresses = result[0] as List;
        final toAddresses = result[1] as List;
        final timestamps = result[2] as List;
        final transactionTypes = result[3] as List;

        for (int i = 0; i < fromAddresses.length; i++) {
          transactions.add({
            'from': (fromAddresses[i] as EthereumAddress).hex,
            'to': (toAddresses[i] as EthereumAddress).hex,
            'timestamp': DateTime.fromMillisecondsSinceEpoch(
              (timestamps[i] as BigInt).toInt() * 1000,
            ).toIso8601String().split('T')[0],
            'type': transactionTypes[i],
          });
        }
      }

      return transactions;
    } catch (e) {
      print('Error fetching transactions: $e');
      return [];
    }
  }

  String getStageLabel(int stage) {
    const stages = [
      'Harvested',
      'Processed', 
      'Exported',
      'Imported',
      'Retail'
    ];
    return stage < stages.length ? stages[stage] : 'Unknown';
  }

  Map<String, dynamic> getLocationCoordinates(String location) {
    // Enhanced location mapping
    final locationMap = {
      // Sri Lanka
      'nuwara eliya': [6.9497, 80.7891],
      'kandy': [7.2906, 80.6337],
      'colombo': [6.9271, 79.8612],
      'galle': [6.0535, 80.2210],
      'matara': [5.9549, 80.5550],
      
      // India
      'darjeeling': [27.0360, 88.2627],
      'assam': [26.2006, 92.9376],
      'kerala': [10.8505, 76.2711],
      'tamil nadu': [11.1271, 78.6569],
      'chennai': [13.0827, 80.2707],
      'mumbai': [19.0760, 72.8777],
      'delhi': [28.7041, 77.1025],
      
      // International
      'dubai': [25.2048, 55.2708],
      'london': [51.5074, -0.1278],
      'new york': [40.7128, -74.0060],
      'singapore': [1.3521, 103.8198],
      'tokyo': [35.6762, 139.6503],
      'hong kong': [22.3193, 114.1694],
    };

    String key = location.toLowerCase().trim();
    
    // Try exact match first
    if (locationMap.containsKey(key)) {
      return {
        'coordinates': locationMap[key],
        'name': location,
      };
    }
    
    // Try partial match
    for (String mapKey in locationMap.keys) {
      if (key.contains(mapKey) || mapKey.contains(key)) {
        return {
          'coordinates': locationMap[mapKey],
          'name': location,
        };
      }
    }
    
    // Default to Colombo if no match
    return {
      'coordinates': [6.9271, 79.8612],
      'name': location,
    };
  }
}