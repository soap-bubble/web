interface WhyAmISeeingThisProps {
  reason: string
}

function WhyAmISeeingThis({ reason }: WhyAmISeeingThisProps) {
  return <div className="why-am-i-seeing-this" title={reason} />
}

export default WhyAmISeeingThis
