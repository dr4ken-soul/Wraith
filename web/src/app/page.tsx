import {Nav} from '@/components/layout/Nav'
import {Hero} from '@/components/sections/Hero'
import {Problem} from '@/components/sections/Problem'
import {Mechanism} from '@/components/sections/Mechanism'
import {LiveStats} from '@/components/sections/LiveStats'
import {Comparison} from '@/components/sections/Comparison'
import {Trust} from '@/components/sections/Trust'
import {FinalCta} from '@/components/sections/FinalCta'
import {Footer} from '@/components/sections/Footer'

/** Renders the public Wraith landing page. */
export default function HomePage() {
  return <><Nav /><main id="main-content"><Hero /><Problem /><Mechanism /><LiveStats /><Comparison /><Trust /><FinalCta /></main><Footer /></>
}

