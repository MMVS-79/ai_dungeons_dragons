import Image from "next/image";
import styles from "./TeamMember.module.css";

interface TeamMemberProps {
  name: string;
  role: string;
  background: string;
  imagePath: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export default function TeamMember({
  name,
  role,
  background,
  imagePath,
  linkedinUrl,
  githubUrl,
}: TeamMemberProps) {
  return (
    <div className={styles.profile}>
      <div className={styles.imageContainer}>
        <Image
          src={imagePath}
          alt={name}
          className={styles.memberPicture}
          width={100}
          height={100}
          style={{ objectFit: "cover" }}
          unoptimized
        />
      </div>
      <p className={styles.memberName}>{name}</p>
      <p className={styles.memberRole}>{role}</p>
      <p className={styles.memberBackground}>{background}</p>
      <div className={styles.profileLinks}>
        {linkedinUrl && (
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
            <Image
              src="/icons/icon_linkedin.png"
              alt="LinkedIn"
              width={30}
              height={30}
              style={{ objectFit: "contain" }}
            />
          </a>
        )}
        {githubUrl && (
          <a href={githubUrl} target="_blank" rel="noopener noreferrer">
            <Image
              src="/icons/icon_github.png"
              alt="GitHub"
              width={30}
              height={30}
              style={{ objectFit: "contain" }}
            />
          </a>
        )}
      </div>
    </div>
  );
}
