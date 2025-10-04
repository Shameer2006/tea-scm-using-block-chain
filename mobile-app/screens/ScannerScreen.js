import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Card, Title, Button, Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const ScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  // Mock product data
  const mockProductData = {
    'TEA001': {
      batchId: 'TEA001',
      variety: 'Earl Grey',
      origin: 'Darjeeling, India',
      status: 'In Transit',
      currentLocation: 'Port of London',
      stakeholder: 'UK Tea Imports Ltd',
      qualityScore: 95
    },
    'TEA002': {
      batchId: 'TEA002',
      variety: 'Green Tea',
      origin: 'Fujian, China',
      status: 'Processing',
      currentLocation: 'Processing Unit, Fujian',
      stakeholder: 'Mountain Tea Processors',
      qualityScore: 88
    }
  };

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    
    // Extract batch ID from QR data
    const batchId = data.replace('TEA-', '');
    const productData = mockProductData[batchId];
    
    if (productData) {
      setScannedData(productData);
      Alert.alert(
        'Product Found!',
        `Successfully scanned ${productData.variety} - ${productData.batchId}`,
        [
          { text: 'Scan Again', onPress: () => setScanned(false) },
          { text: 'View Details', onPress: () => {} }
        ]
      );
    } else {
      Alert.alert(
        'Product Not Found',
        'This product is not in our database.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'harvested': return '#22c55e';
      case 'processing': return '#eab308';
      case 'in transit': return '#3b82f6';
      case 'delivered': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.permissionCard}>
          <Card.Content style={styles.permissionContent}>
            <Icon name="camera-alt" size={64} color="#6b7280" />
            <Title style={styles.permissionTitle}>Camera Access Required</Title>
            <Text style={styles.permissionText}>
              Please grant camera permission to scan QR codes
            </Text>
            <Button
              mode="contained"
              onPress={() => BarCodeScanner.requestPermissionsAsync()}
              style={styles.permissionButton}
            >
              Grant Permission
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.camera}
        />
        
        {/* Scanning Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
          </View>
          
          <Surface style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              Position QR code within the frame to scan
            </Text>
          </Surface>
        </View>
      </View>

      {/* Scanned Product Information */}
      {scannedData && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.resultHeader}>
              <Title>{scannedData.variety}</Title>
              <Surface style={[styles.statusBadge, { backgroundColor: getStatusColor(scannedData.status) }]}>
                <Text style={styles.statusText}>{scannedData.status}</Text>
              </Surface>
            </View>
            
            <View style={styles.resultDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Batch ID:</Text>
                <Text style={styles.detailValue}>{scannedData.batchId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Origin:</Text>
                <Text style={styles.detailValue}>{scannedData.origin}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{scannedData.currentLocation}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quality Score:</Text>
                <Text style={styles.detailValue}>{scannedData.qualityScore}/100</Text>
              </View>
            </View>

            <View style={styles.resultActions}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Traceability')}
                style={styles.actionButton}
                icon="track-changes"
              >
                View Traceability
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setScanned(false);
                  setScannedData(null);
                }}
                style={styles.actionButton}
              >
                Scan Again
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Manual Input Option */}
      <Card style={styles.manualCard}>
        <Card.Content>
          <Button
            mode="text"
            onPress={() => {
              // Navigate to manual input screen or show modal
              Alert.alert('Manual Entry', 'Manual entry feature coming soon!');
            }}
            icon="keyboard"
          >
            Enter Batch ID Manually
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instructionCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  instructionText: {
    textAlign: 'center',
    color: '#111827',
  },
  permissionCard: {
    margin: 20,
  },
  permissionContent: {
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#6b7280',
  },
  permissionButton: {
    marginTop: 16,
  },
  resultCard: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  detailValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  manualCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});

export default ScannerScreen;