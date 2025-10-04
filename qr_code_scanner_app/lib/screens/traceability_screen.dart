import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../services/blockchain_service.dart';

class TraceabilityScreen extends StatefulWidget {
  final String batchId;

  const TraceabilityScreen({super.key, required this.batchId});

  @override
  State<TraceabilityScreen> createState() => _TraceabilityScreenState();
}

class _TraceabilityScreenState extends State<TraceabilityScreen> {
  Map<String, dynamic>? productData;
  List<Map<String, dynamic>> transactions = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadProductData();
  }

  Future<void> _loadProductData() async {
    try {
      final blockchainService = BlockchainService();
      
      // Fetch product data from blockchain
      final product = await blockchainService.getProduct(widget.batchId);
      
      if (product == null) {
        setState(() {
          error = 'Product not found on blockchain';
          isLoading = false;
        });
        return;
      }
      
      // Fetch transaction history
      final txHistory = await blockchainService.getProductTransactions(widget.batchId);
      
      setState(() {
        productData = {
          'batchId': product['batchId'],
          'name': product['name'],
          'type': product['productType'],
          'harvestDate': product['harvestDate'],
          'currentOwner': product['currentOwner'],
          'status': blockchainService.getStageLabel(product['currentStage']),
          'harvestLocation': product['harvestLocation'],
        };
        
        // Convert blockchain transactions to display format
        transactions = txHistory.map((tx) {
          final locationData = blockchainService.getLocationCoordinates(
            product['harvestLocation'] ?? 'Unknown'
          );
          
          return {
            'type': blockchainService.getStageLabel(tx['type']),
            'stakeholder': '${tx['to'].substring(0, 10)}...${tx['to'].substring(tx['to'].length - 8)}',
            'location': locationData['name'],
            'date': tx['timestamp'],
            'coordinates': locationData['coordinates'],
          };
        }).toList();
        
        // If no transactions, add harvest transaction
        if (transactions.isEmpty) {
          final locationData = blockchainService.getLocationCoordinates(
            product['harvestLocation'] ?? 'Unknown'
          );
          
          transactions.add({
            'type': 'Harvested',
            'stakeholder': '${product['currentOwner'].substring(0, 10)}...${product['currentOwner'].substring(product['currentOwner'].length - 8)}',
            'location': locationData['name'],
            'date': product['harvestDate'],
            'coordinates': locationData['coordinates'],
          });
        }
        
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = 'Failed to load blockchain data: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Loading...'),
          backgroundColor: Colors.green[600],
          foregroundColor: Colors.white,
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (error != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Error'),
          backgroundColor: Colors.red[600],
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(error!, style: const TextStyle(fontSize: 18)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Batch ${widget.batchId}'),
        backgroundColor: Colors.green[600],
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Product Info Card
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.green[100],
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Icon(
                          Icons.local_drink,
                          color: Colors.green[600],
                          size: 30,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              productData!['name'],
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              productData!['type'],
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _buildInfoRow('Batch ID', widget.batchId),
                  _buildInfoRow('Harvest Date', productData!['harvestDate']),
                  _buildInfoRow('Current Owner', productData!['currentOwner']),
                  _buildInfoRow('Status', productData!['status']),
                  _buildInfoRow('Quality Score', '${productData!['qualityScore']}/100'),
                ],
              ),
            ),

            // Map
            Container(
              height: 300,
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: FlutterMap(
                  options: MapOptions(
                    initialCenter: LatLng(
                      transactions.first['coordinates'][0],
                      transactions.first['coordinates'][1],
                    ),
                    initialZoom: 8.0,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.tea_scanner',
                    ),
                    MarkerLayer(
                      markers: transactions.asMap().entries.map((entry) {
                        int index = entry.key;
                        Map<String, dynamic> transaction = entry.value;
                        
                        return Marker(
                          point: LatLng(
                            transaction['coordinates'][0],
                            transaction['coordinates'][1],
                          ),
                          width: 40,
                          height: 40,
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.green[600],
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white, width: 3),
                            ),
                            child: Center(
                              child: Text(
                                '${index + 1}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),

            // Timeline
            Container(
              margin: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Supply Chain Journey',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...transactions.asMap().entries.map((entry) {
                    int index = entry.key;
                    Map<String, dynamic> transaction = entry.value;
                    bool isLast = index == transactions.length - 1;
                    
                    return _buildTimelineItem(
                      transaction,
                      index + 1,
                      isLast,
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const Text(': '),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(Map<String, dynamic> transaction, int step, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.green[600],
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  '$step',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 60,
                color: Colors.green[300],
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  blurRadius: 5,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction['type'],
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  transaction['stakeholder'],
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        transaction['location'],
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      transaction['date'],
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}