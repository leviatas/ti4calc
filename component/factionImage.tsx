// import Image from 'next/image'
import { useLayoutEffect, useState } from "react"

import { Faction } from "@/core/factions/faction"

import styles from "@/component/factionImage.module.scss"

interface Props {
  faction: Faction
  side: "left" | "right"
  style?: React.CSSProperties
}

export default function FactionImage(props: Props) {
  // Do not use next/image before they cache it properly
  // In the meantime I just use it to generate optimized images in the correct size, then use that image in a normal <img />

  const [url, setUrl] = useState<string>()

  // the faction is retrieved from localstorage. Showing the faction before that would result in an ugly flash.
  // So here we make sure no image is set in ssr.
  useLayoutEffect(() => {
    // e.g. "Vuil'Raith" -> "vuilraith", "Ruby Monarch (TF)" -> "ruby_monarch_tf"
    const imageName = props.faction.replaceAll(" ", "_").replaceAll(/['()]/g, "").toLowerCase()
    // oxlint-disable-next-line react/set-state-in-effect
    setUrl(`/factions/small/${imageName}.webp`)
  }, [props.faction])

  return (
    <div {...props} className={styles.container}>
      {/* <Image
        src={`/factions/${props.faction.replaceAll(' ', '_').replaceAll("'", '').toLowerCase()}.png`}
        alt=""
        width={640}
        height={828}
      /> */}
      {/* intentionally a plain <img> (see note above) rather than next/image */}
      {/* oxlint-disable-next-line nextjs/no-img-element */}
      <img
        src={url}
        alt=""
        width={640}
        height={828}
        className={props.side === "left" ? styles.left : styles.right}
        style={{ float: props.side === "left" ? "right" : "left" }}
      />
    </div>
  )
}
