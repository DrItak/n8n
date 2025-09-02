import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useWorkflow, Workflow } from '../context/WorkflowContext';

const { width } = Dimensions.get('window');

const WorkflowListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, deleteWorkflow, setCurrentWorkflow } = useWorkflow();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');

  const filteredAndSortedWorkflows = useMemo(() => {
    let filtered = state.workflows;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(workflow =>
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(workflow =>
        filterStatus === 'active' ? workflow.isActive : !workflow.isActive
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'status':
          return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [state.workflows, searchQuery, filterStatus, sortBy]);

  const handleWorkflowPress = (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
    navigation.navigate('WorkflowEditor' as never);
  };

  const handleDeleteWorkflow = (workflow: Workflow) => {
    Alert.alert(
      'Delete Workflow',
      `Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkflow(workflow.id),
        },
      ]
    );
  };

  const handleToggleWorkflow = (workflow: Workflow) => {
    const updatedWorkflow = { ...workflow, isActive: !workflow.isActive };
    // TODO: Implement updateWorkflow function call
    Alert.alert(
      'Workflow Updated',
      `Workflow "${workflow.name}" is now ${updatedWorkflow.isActive ? 'active' : 'inactive'}`,
      [{ text: 'OK' }]
    );
  };

  const renderWorkflowItem = ({ item: workflow }: { item: Workflow }) => (
    <TouchableOpacity
      style={styles.workflowCard}
      onPress={() => handleWorkflowPress(workflow)}
    >
      <View style={styles.workflowHeader}>
        <View style={styles.workflowInfo}>
          <Text style={styles.workflowName}>{workflow.name}</Text>
          <View style={styles.workflowMeta}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: workflow.isActive ? '#34C759' : '#8E8E93' }
            ]} />
            <Text style={styles.workflowDate}>
              {workflow.updatedAt.toLocaleDateString()}
            </Text>
            <Text style={styles.nodeCount}>
              {workflow.nodes.length} nodes
            </Text>
          </View>
        </View>
        <View style={styles.workflowActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleWorkflow(workflow)}
          >
            <Icon
              name={workflow.isActive ? 'pause' : 'play'}
              size={20}
              color={workflow.isActive ? '#FF9500' : '#34C759'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteWorkflow(workflow)}
          >
            <Icon name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      
      {workflow.description && (
        <Text style={styles.workflowDescription} numberOfLines={2}>
          {workflow.description}
        </Text>
      )}

      <View style={styles.workflowFooter}>
        <View style={styles.integrationStatus}>
          <Icon
            name={
              workflow.nativeIntegration.type === 'shortcuts' ? 'cellphone-link' :
              workflow.nativeIntegration.type === 'applescript' ? 'code-braces' :
              workflow.nativeIntegration.type === 'automator' ? 'cog' : 'link-off'
            }
            size={16}
            color="#8E8E93"
          />
          <Text style={styles.integrationText}>
            {workflow.nativeIntegration.type === 'none' 
              ? 'Not integrated' 
              : workflow.nativeIntegration.type
            }
          </Text>
        </View>
        
        <View style={[
          styles.statusBadge,
          {
            backgroundColor:
              workflow.nativeIntegration.status === 'deployed' ? '#34C759' :
              workflow.nativeIntegration.status === 'generated' ? '#FF9500' :
              workflow.nativeIntegration.status === 'error' ? '#FF3B30' : '#8E8E93'
          }
        ]}>
          <Text style={styles.statusText}>
            {workflow.nativeIntegration.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ title, isActive, onPress }: {
    title: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const SortButton = ({ title, isActive, onPress }: {
    title: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.sortButton, isActive && styles.sortButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.sortButtonText, isActive && styles.sortButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workflows</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('WorkflowEditor' as never)}
        >
          <Icon name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workflows..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <Text style={styles.filtersLabel}>Status:</Text>
        <View style={styles.filterButtons}>
          <FilterButton
            title="All"
            isActive={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
          />
          <FilterButton
            title="Active"
            isActive={filterStatus === 'active'}
            onPress={() => setFilterStatus('active')}
          />
          <FilterButton
            title="Inactive"
            isActive={filterStatus === 'inactive'}
            onPress={() => setFilterStatus('inactive')}
          />
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortSection}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <SortButton
            title="Date"
            isActive={sortBy === 'date'}
            onPress={() => setSortBy('date')}
          />
          <SortButton
            title="Name"
            isActive={sortBy === 'name'}
            onPress={() => setSortBy('name')}
          />
          <SortButton
            title="Status"
            isActive={sortBy === 'status'}
            onPress={() => setSortBy('status')}
          />
        </View>
      </View>

      {/* Workflows List */}
      <FlatList
        data={filteredAndSortedWorkflows}
        renderItem={renderWorkflowItem}
        keyExtractor={(item) => item.id}
        style={styles.workflowsList}
        contentContainerStyle={styles.workflowsListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="workflow" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No workflows found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first workflow to get started'
              }
            </Text>
            {!searchQuery && filterStatus === 'all' && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => navigation.navigate('WorkflowEditor' as never)}
              >
                <Text style={styles.createFirstButtonText}>Create Workflow</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filtersLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sortSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  workflowsList: {
    flex: 1,
  },
  workflowsListContent: {
    padding: 20,
  },
  workflowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workflowInfo: {
    flex: 1,
  },
  workflowName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  workflowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  workflowDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  nodeCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  workflowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workflowDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  workflowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  integrationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  integrationText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  createFirstButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkflowListScreen;