import { DomainService } from "@/src/api/service.api";
import AppText from "@/src/components/ui/AppText";
import OptimizedImage from "@/src/components/ui/OptimizedImage";
import React from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";

interface CategoryCardProps {
  service: DomainService;
  onPress: () => void;
  cardWidth?: number;
}

const { width } = Dimensions.get("window");
export const CARD_WIDTH = Math.min(125, width * 0.32);

export const CategoryCard: React.FC<CategoryCardProps> = React.memo(({ service, onPress, cardWidth }) => {
  const imageUrl = service.domainImage || (service as any).serviceImage || (service as any).image;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth || CARD_WIDTH },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${service.domainName} service`}
    >
      <View style={styles.imageContainer}>
        <OptimizedImage
          uri={imageUrl}
          style={styles.image}
          contentFit="cover"
          transition={250}
        />
      </View>
      <View style={styles.contentContainer}>
        <AppText weight="semibold" numberOfLines={2} style={styles.titleText}>
          {service.domainName}
        </AppText>
      </View>
    </Pressable>
  );
});

CategoryCard.displayName = "CategoryCard";

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 150,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  titleText: {
    color: "#111827",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});

export default CategoryCard;
