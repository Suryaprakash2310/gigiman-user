import { ServiceAPI } from "@/src/api/service.api";
import ServiceCategoryCard from "@/src/components/ServiceCategoryCard";
import AppHeader from "@/src/components/ui/AppHeader";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

// ...existing code...
export default function ServiceCategory({ route, navigation }: any) {
  const { serviceName, domainServiceId } = route.params;
  const [categories, setCategories] = useState<any[]>([]);
  //const styles = createStyles(theme);
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    if (!domainServiceId) return; // guard
    const res = await ServiceAPI.getSubServicesAPI(domainServiceId);
    // backend returns { success: true, services: [...] }
    const filtered = (res.services || []).filter(
      (c: any) => c.parentServiceName === serviceName
    );
    setCategories(filtered);
  };
// ...existing code...

  return (
    <View style={{ flex: 1 }}>
      <AppHeader showBack title={serviceName} />

      <ScrollView>
        {categories.map((cat) => (
          <ServiceCategoryCard
            key={cat._id}
            title={cat.serviceCategoryName}
            subtitle={cat.description}
            amount={cat.price}
            onPress={() =>
              navigation.navigate("Booking", {
                serviceCategoryId: cat._id,
              })
            }
          />

        ))}
      </ScrollView>
    </View>
  );
}


// const styles = StyleSheet.create({
//   safe: {
//     flex: 1,
//   },
//   scroll: {
//     paddingBottom: 40,
//   },
//   heroCard: {
//     marginHorizontal: 16,
//     marginTop: 16,
//     marginBottom: 24,
//     borderRadius: 24,
//     borderWidth: 1,
//     borderColor: 'transparent',
//     overflow: 'hidden',
//     // --- Corrected Shadow ---
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.8,
//     shadowRadius: 20,
//     elevation: 7,
//   },
//   heroImagePlaceholder: {
//     height: 160,
//     width: '100%',
//   },
//   heroContent: {
//     paddingHorizontal: 20,
//     paddingVertical: 24,
//   },
//   heroTitle: {
//     marginBottom: 4,
//   },
//   servicesList: {
//     paddingHorizontal: 16,
//   },
// });
