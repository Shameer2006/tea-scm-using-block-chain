import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalProducts: 1247,
    inTransit: 89,
    completed: 1098,
    pending: 60
  });

  const [recentActivity] = useState([
    { id: 1, action: 'Product Created', product: 'Earl Grey Batch #001', time: '2 hours ago' },
    { id: 2, action: 'Quality Test', product: 'Green Tea Batch #045', time: '4 hours ago' },
    { id: 3, action: 'Shipment Delivered', product: 'Oolong Batch #023', time: '1 day ago' },
  ]);

  const StatCard = ({ title, value, icon, color }) => (
    <Surface style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statText}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <Icon name={icon} size={32} color={color} />
      </View>
    </Surface>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.welcomeTitle}>Welcome to TeaChain</Title>
        <Paragraph style={styles.welcomeSubtitle}>
          Track your tea supply chain with blockchain transparency
        </Paragraph>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon="inventory"
          color="#22c55e"
        />
        <StatCard
          title="In Transit"
          value={stats.inTransit}
          icon="local-shipping"
          color="#3b82f6"
        />
        <StatCard
          title="Completed"
          value={stats.completed.toLocaleString()}
          icon="check-circle"
          color="#10b981"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon="schedule"
          color="#f59e0b"
        />
      </View>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Scanner')}
              style={styles.actionButton}
              icon="qr-code-scanner"
            >
              Scan QR Code
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Products')}
              style={styles.actionButton}
              icon="add"
            >
              Add Product
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Activity</Title>
          {recentActivity.map((activity) => (
            <Surface key={activity.id} style={styles.activityItem}>
              <View style={styles.activityContent}>
                <View style={styles.activityText}>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                  <Text style={styles.activityProduct}>{activity.product}</Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </Surface>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#22c55e',
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statText: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  activityItem: {
    marginTop: 12,
    borderRadius: 8,
    elevation: 1,
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  activityText: {
    flex: 1,
  },
  activityAction: {
    fontWeight: 'bold',
    color: '#111827',
  },
  activityProduct: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  activityTime: {
    color: '#9ca3af',
    fontSize: 12,
  },
});

export default DashboardScreen;