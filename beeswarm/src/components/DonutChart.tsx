// import React from "react";
// import { Text, View } from "react-native";
// import { THEME } from "../theme";

// type Segment = {
//   pct: number;
//   color: string;
//   label: string;
//   count: number;
// };

// type Props = {
//   segments: Segment[];
//   total: number;
// };

// export function DonutChart({ segments, total }: Props) {
//   const SIZE = 120;
//   const STROKE = 18;

//   let cumulativePct = 0;
//   const arcs = segments.map((seg) => {
//     const start = cumulativePct;
//     cumulativePct += seg.pct;
//     return { ...seg, start, end: cumulativePct };
//   });

//   return (
//     <View
//       style={{
//         width: SIZE,
//         height: SIZE,
//         position: "relative",
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       {/* Background ring */}
//       <View
//         style={{
//           width: SIZE,
//           height: SIZE,
//           borderRadius: SIZE / 2,
//           borderWidth: STROKE,
//           borderColor: "#F1F5F9",
//           position: "absolute",
//         }}
//       />
//       {/* Colored segments */}
//       {arcs.map((arc, i) => {
//         const deg = arc.pct * 360;
//         const rotateDeg = arc.start * 360;
//         if (deg < 1) return null;
//         return (
//           <View
//             key={i}
//             style={{
//               width: SIZE,
//               height: SIZE,
//               borderRadius: SIZE / 2,
//               position: "absolute",
//               overflow: "hidden",
//             }}
//           >
//             <View
//               style={{
//                 width: SIZE,
//                 height: SIZE,
//                 borderRadius: SIZE / 2,
//                 borderWidth: STROKE,
//                 borderColor: "transparent",
//                 borderTopColor: arc.color,
//                 borderRightColor: deg > 90 ? arc.color : "transparent",
//                 borderBottomColor: deg > 180 ? arc.color : "transparent",
//                 borderLeftColor: deg > 270 ? arc.color : "transparent",
//                 transform: [{ rotate: `${rotateDeg - 90}deg` }],
//                 position: "absolute",
//               }}
//             />
//           </View>
//         );
//       })}
//       {/* Center label */}
//       <View style={{ alignItems: "center" }}>
//         <Text style={{ fontSize: 22, fontWeight: "800", color: THEME.primary }}>{total}</Text>
//         <Text style={{ fontSize: 10, color: THEME.textMuted, fontWeight: "600" }}>Hives</Text>
//       </View>
//     </View>
//   );
// }

import React from "react";
import { Text, View } from "react-native";
import { THEME } from "../theme";

type Segment = {
  pct: number;
  color: string;
  label: string;
  count: number;
};

type Props = {
  segments: Segment[];
  total: number;
};

export function DonutChart({ segments, total }: Props) {
  const SIZE = 120;
  const STROKE = 18;

  const safeTotal = total ?? 0;
  //  const hasData = safeTotal > 0 && segments?.some(s => s.count > 0);
  const hasData = safeTotal > 0;

  // ✅ EMPTY STATE (no hives)
  // if (!hasData) {
  //   return (
  //     <View
  //       style={{
  //         width: SIZE,
  //         height: SIZE,
  //         alignItems: "center",
  //         justifyContent: "center",
  //       }}
  //     >
  //       {/* background ring */}
  //       <View
  //         style={{
  //           width: SIZE,
  //           height: SIZE,
  //           borderRadius: SIZE / 2,
  //           borderWidth: STROKE,
  //           borderColor: "#F1F5F9",
  //           position: "absolute",
  //         }}
  //       />

  //       <View style={{ alignItems: "center" }}>
  //         <Text style={{ fontSize: 22, fontWeight: "800", color: THEME.primary }}>
  //           0
  //         </Text>
  //         <Text style={{ fontSize: 10, color: THEME.textMuted, fontWeight: "600" }}>
  //           Hives
  //         </Text>
  //       </View>
  //     </View>
  //   );
  // }

  if ((total ?? 0) === 0) {
  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: STROKE,
          borderColor: "#F1F5F9",
          position: "absolute",
        }}
      />

      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: THEME.primary,
          }}
        >
          0
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: THEME.textMuted,
            fontWeight: "600",
          }}
        >
          Hives
        </Text>
      </View>
    </View>
  );
}

  // ✅ sanitize segments (remove bad data)
  const cleanSegments = segments
    .filter(s => s.count > 0 && isFinite(s.pct) && s.pct > 0)
    .map(s => ({
      ...s,
      pct: Math.max(0, Math.min(1, s.pct)),
    }));

  // ✅ build arcs safely
  let cumulativePct = 0;

  const arcs = cleanSegments.map((seg) => {
    const start = cumulativePct;
    cumulativePct += seg.pct;

    return {
      ...seg,
      start,
      end: cumulativePct,
    };
  });

  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background ring */}
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: STROKE,
          borderColor: "#F1F5F9",
          position: "absolute",
        }}
      />

      {/* Segments */}
      {arcs.map((arc, i) => {
        const deg = arc.pct * 360;
        const rotateDeg = arc.start * 360;

        if (!isFinite(deg) || deg < 1) return null;

        return (
          <View
            key={i}
            style={{
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              position: "absolute",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
                borderWidth: STROKE,
                borderColor: "transparent",
                borderTopColor: arc.color,
                borderRightColor: deg > 90 ? arc.color : "transparent",
                borderBottomColor: deg > 180 ? arc.color : "transparent",
                borderLeftColor: deg > 270 ? arc.color : "transparent",
                transform: [{ rotate: `${rotateDeg - 90}deg` }],
                position: "absolute",
              }}
            />
          </View>
        );
      })}

      {/* Center label */}
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: THEME.primary }}>
          {safeTotal}
        </Text>
        <Text style={{ fontSize: 10, color: THEME.textMuted, fontWeight: "600" }}>
          Hives
        </Text>
      </View>
    </View>
  );
}