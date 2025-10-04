import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'traceability_screen.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool isFlashOn = false;
  bool isScanning = true;

  @override
  void reassemble() {
    super.reassemble();
    if (controller != null) {
      controller!.pauseCamera();
      controller!.resumeCamera();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: Colors.green[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: () async {
              await controller?.toggleFlash();
              setState(() {
                isFlashOn = !isFlashOn;
              });
            },
            icon: Icon(isFlashOn ? Icons.flash_on : Icons.flash_off),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            flex: 4,
            child: Stack(
              children: [
                QRView(
                  key: qrKey,
                  onQRViewCreated: _onQRViewCreated,
                  overlay: QrScannerOverlayShape(
                    borderColor: Colors.green,
                    borderRadius: 10,
                    borderLength: 30,
                    borderWidth: 10,
                    cutOutSize: 250,
                  ),
                ),
                if (!isScanning)
                  Container(
                    color: Colors.black.withOpacity(0.5),
                    child: const Center(
                      child: CircularProgressIndicator(
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              color: Colors.grey[100],
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.qr_code_scanner,
                    size: 40,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Position QR code within the frame',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'The scanner will automatically detect the code',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      if (isScanning && scanData.code != null) {
        setState(() {
          isScanning = false;
        });
        
        _processQRCode(scanData.code!);
      }
    });
  }

  void _processQRCode(String qrData) {
    // Extract batch ID from QR code
    String batchId = '';
    
    if (qrData.startsWith('TEA-')) {
      batchId = qrData.substring(4); // Remove 'TEA-' prefix
    } else if (qrData.startsWith('TEA')) {
      batchId = qrData; // Direct batch ID
    } else {
      // Try to extract batch ID from URL or other formats
      final regex = RegExp(r'TEA[A-Z0-9]+');
      final match = regex.firstMatch(qrData);
      if (match != null) {
        batchId = match.group(0)!;
      }
    }

    if (batchId.isNotEmpty) {
      // Navigate to traceability screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => TraceabilityScreen(batchId: batchId),
        ),
      );
    } else {
      // Invalid QR code
      Fluttertoast.showToast(
        msg: 'Invalid tea product QR code',
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
        textColor: Colors.white,
      );
      
      setState(() {
        isScanning = true;
      });
    }
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
}