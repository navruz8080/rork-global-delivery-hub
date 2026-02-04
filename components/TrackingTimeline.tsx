import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package, CheckCircle, Truck, MapPin, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { TrackingEvent, OrderStatus } from '@/types';

interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: OrderStatus;
}

const statusIcons: Record<string, typeof Package> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Package,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: Package,
  returned: Package,
};

export default function TrackingTimeline({ events, currentStatus }: TrackingTimelineProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const reversedEvents = [...events].reverse();

  return (
    <View style={styles.container}>
      {reversedEvents.map((event, index) => {
        const Icon = statusIcons[event.status] || Package;
        const isFirst = index === 0;
        const isLast = index === reversedEvents.length - 1;
        const isActive = isFirst;
        const { date, time } = formatTimestamp(event.timestamp);

        return (
          <View key={event.id} style={styles.eventRow}>
            <View style={styles.timeline}>
              <View style={[
                styles.iconContainer,
                isActive && styles.iconContainerActive,
              ]}>
                <Icon 
                  size={16} 
                  color={isActive ? Colors.light.surface : Colors.light.textTertiary} 
                />
              </View>
              {!isLast && (
                <View style={[
                  styles.line,
                  isActive && styles.lineActive,
                ]} />
              )}
            </View>
            
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={[styles.status, isActive && styles.statusActive]}>
                  {event.description}
                </Text>
                <Text style={styles.time}>{time}</Text>
              </View>
              <View style={styles.details}>
                <MapPin size={12} color={Colors.light.textTertiary} />
                <Text style={styles.location}>{event.location}</Text>
                <Text style={styles.date}>{date}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  eventRow: {
    flexDirection: 'row',
    minHeight: 70,
  },
  timeline: {
    alignItems: 'center',
    width: 40,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainerActive: {
    backgroundColor: Colors.light.secondary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
  },
  lineActive: {
    backgroundColor: Colors.light.secondary,
  },
  content: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  status: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  statusActive: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
});
