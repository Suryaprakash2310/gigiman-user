import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Button, FlatList, Image } from 'react-native';
import AppInput from '../components/ui/AppInput';
import { useTheme } from '../theme/useTheme';
import AppCard from '../components/ui/AppCard';
import AppText from '../components/ui/AppText';
import { MaterialIcons } from '@expo/vector-icons';


// Import your component here
// import MyComponent from './MyComponent';
type Category = {
  id: string;
  name: string;
  icon: "restaurant" | "flight" | "shopping-cart" | "fitness-center";
};

const categories: Category[] = [
  { id: "1", name: "Food", icon: "restaurant" },
  { id: "2", name: "Travel", icon: "flight" },
  { id: "3", name: "Shopping", icon: "shopping-cart" },
  { id: "4", name: "Fitness", icon: "fitness-center" },
];



 export const PhoneNumScreen = () => {
    const { setMode } = useTheme();
    setMode('light');
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Component Testing Screen</Text>
      <View style={styles.componentWrapper}>
        {/* Place your component here */}
        {/* <MyComponent /> */}
        <AppInput
        label="Username"
        placeholder="Enter your username"
        //value={username}
        //onChangeText={setUsername}
        error='yes'
      />
      <AppCard style={{ backgroundColor: '#f0f0f0' }}>
        <Text>Another card with custom background color.</Text>
      </AppCard>
      <AppCard style={{ backgroundColor: '#f0f0f0' }}>
      <AppText weight="semibold" size="h3">Surya Prakash</AppText>
      <AppText color="textMuted">90847XXXXX</AppText>
      <AppText color="textMuted">90847XXXXX</AppText>
      <AppText color="textMuted">90847XXXXX</AppText>
      <AppText color="textMuted">90847XXXXX</AppText>
      <AppText color="textMuted">90847XXXXX</AppText>
    </AppCard>
    <FlatList
  data={categories}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <FlatList
  data={categories}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <AppCard style={{ flexDirection: 'column', alignItems: 'center', backgroundColor: '#ef6d9fff' }}>
      <MaterialIcons  name={item.icon} size={30} color="#333" />
      <AppText style={{ marginLeft: 12 }}>{item.name}</AppText>
    </AppCard>
  )}
/>

  )}
/>




      {/* <Button onPress={() => setMode('light')} title='hih'/> */}


        <Text>👆 Replace this with your component</Text>
      </View>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  componentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 20,
  },
});