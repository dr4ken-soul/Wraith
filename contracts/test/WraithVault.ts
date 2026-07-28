import {expect} from 'chai'
import {ethers} from 'hardhat'

describe('WraithVault', function () {
  it('wires the router, keeper, and fee tier from the constructor', async function () {
    const [deployer, keeper] = await ethers.getSigners()
    const router = ethers.Wallet.createRandom().address
    const Factory = await ethers.getContractFactory('WraithVault')
    const vault = await Factory.deploy(router, keeper.address, 3000)
    await vault.waitForDeployment()

    expect(await vault.swapRouter()).to.equal(router)
    expect(await vault.keeper()).to.equal(keeper.address)
    expect(await vault.poolFee()).to.equal(3000)
    expect(await vault.nextOrderId()).to.equal(1)
    expect(deployer.address).to.not.equal(keeper.address)
  })

  it('rejects keeper-only methods from another account', async function () {
    const [deployer, keeper] = await ethers.getSigners()
    const Factory = await ethers.getContractFactory('WraithVault')
    const vault = await Factory.deploy(ethers.Wallet.createRandom().address, keeper.address, 3000)
    await vault.waitForDeployment()

    await expect(vault.connect(deployer).getOpenOrderIds()).to.be.revertedWith('caller is not keeper')
  })
})

