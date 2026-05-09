import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Switch, Modal, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../../constants/colors';
import { restaurantsApi, BASE_URL, resolveImageUri } from '../../services/api';
import i18n from '../../constants/i18n';

const CATEGORIES = ['Fast Food', 'Local', 'Drinks', 'Snacks', 'Meat', 'Fish'];

export default function MenuManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', image: null as any });
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await restaurantsApi.getOwnerMenu();
      const menuData = res.data.results || res.data;
      setItems(Array.isArray(menuData) ? menuData : []);
    } catch (e: any) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const toggleAvailability = async (id: number, val: boolean) => {
    try {
      await restaurantsApi.toggleMenuItem(id, val);
      setItems(items.map(it => it.id === id ? { ...it, is_available: val } : it));
    } catch { Alert.alert('Error', 'Failed to update availability'); }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!res.canceled) setFormData({ ...formData, image: res.assets[0] });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) return;
    setSubmitting(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('description', formData.description);
    if (formData.image?.uri && !formData.image.uri.startsWith('http')) {
      const uri = formData.image.uri;
      const name = uri.split('/').pop() || 'image.jpg';
      const type = `image/${name.split('.').pop()}`;
      data.append('image', { uri, name, type } as any);
    }

    try {
      if (editingItem) await restaurantsApi.updateMenuItem(editingItem.id, data);
      else await restaurantsApi.createMenuItem(data);
      setModalVisible(false);
      setEditingItem(null);
      setFormData({ name: '', price: '', description: '', image: null });
      fetchMenu();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save menu item');
    } finally { setSubmitting(false); }
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    const imgUri = resolveImageUri(item.image);
    setFormData({ name: item.name, price: String(item.price), description: item.description || '', image: { uri: imgUri } });
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('owner.menu.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingItem(null); setFormData({ name: '', price: '', description: '', image: null }); setModalVisible(true); }}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>{i18n.t('owner.menu.add')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} /> : (
        <FlatList
          data={items}
          keyExtractor={it => String(it.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
              <Image source={{ uri: resolveImageUri(item.image) || 'https://via.placeholder.com/150' }} style={styles.img} />
              <View style={styles.body}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>TSh {Number(item.price).toLocaleString()}</Text>
                <View style={styles.row}>
                  <Text style={styles.availText}>{item.is_available ? i18n.t('food.available') : i18n.t('food.unavailable')}</Text>
                  <Switch value={item.is_available} onValueChange={(v) => toggleAvailability(item.id, v)} />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? i18n.t('owner.menu.editTitle') : i18n.t('owner.menu.addTitle')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={Colors.black} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.form}>
              <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
                {formData.image?.uri ? <Image source={{ uri: formData.image.uri }} style={styles.pickedImg} /> : <Ionicons name="camera" size={32} color={Colors.gray} />}
                <Text style={styles.pickerTxt}>{i18n.t('owner.menu.selectPhoto')}</Text>
              </TouchableOpacity>
              <Input label={i18n.t('owner.menu.name')} placeholder="Burger" value={formData.name} onChangeText={(v: string) => setFormData({ ...formData, name: v })} />
              <Input label={i18n.t('owner.menu.price')} placeholder="5000" keyboardType="numeric" value={formData.price} onChangeText={(v: string) => setFormData({ ...formData, price: v })} />
              <Input label={i18n.t('owner.menu.desc')} placeholder="Maelezo kidogo..." multiline value={formData.description} onChangeText={(v: string) => setFormData({ ...formData, description: v })} />
              
              <TouchableOpacity style={[styles.saveBtn, (!formData.name || !formData.price) && { opacity: 0.5 }]} disabled={submitting || !formData.name || !formData.price} onPress={handleSave}>
                {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>{i18n.t('owner.menu.save')}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Input({ label, ...props }: { label: string; [key: string]: any }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} {...props} placeholderTextColor={Colors.gray} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralLight, paddingTop: 60 },
  header: { padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.tertiary },
  addBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, gap: 6 },
  addBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, flexDirection: 'row', overflow: 'hidden', ...Shadow.sm },
  img: { width: 100, height: 100 },
  body: { flex: 1, padding: 12, gap: 4 },
  name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.black },
  price: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  availText: { fontSize: 11, color: Colors.gray },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%', padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.black },
  form: { gap: 20 },
  imgPicker: { height: 150, backgroundColor: Colors.grayLight, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.gray },
  pickedImg: { ...StyleSheet.absoluteFillObject, borderRadius: Radius.lg },
  pickerTxt: { fontSize: 12, color: Colors.gray, marginTop: 8 },
  inputWrap: { gap: 6, marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.gray },
  input: { backgroundColor: Colors.neutralLight, padding: 14, borderRadius: Radius.md, fontSize: FontSize.md, color: Colors.black },
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: Radius.md, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
